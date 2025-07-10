document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-questions-button');
    const questionsContainer = document.getElementById('questions-container');
    const workerUrl = 'https://enem-analyzer.alf.zamprep.workers.dev';

    if (generateBtn && questionsContainer) {
        generateBtn.addEventListener('click', async () => {
            generateBtn.innerText = 'Gerando...';
            generateBtn.disabled = true;
            questionsContainer.innerHTML = '<p>Carregando novas questões do nosso banco de dados...</p>';

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'get_practice_questions',
                        payload: 'linguagens'
                    })
                });

                const questions = await response.json();

                if (!response.ok || !questions || questions.length === 0) {
                    throw new Error('Não foi possível carregar as questões no momento. Tente novamente.');
                }
                
                displayQuestions(questions);

            } catch (error) {
                questionsContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
            } finally {
                generateBtn.innerText = 'Gerar 5 Novas Questões';
                generateBtn.disabled = false;
            }
        });
    }

    function displayQuestions(questions) {
        questionsContainer.innerHTML = ''; // Clear loading message
        questions.forEach((q, index) => {
            const options = JSON.parse(q.options);
            let optionsHTML = '';
            options.forEach((opt, i) => {
                optionsHTML += `
                    <div class="option">
                        <input type="radio" id="q${index}_opt${i}" name="question_${index}" value="${i}">
                        <label for="q${index}_opt${i}">${opt.option}</label>
                    </div>
                `;
            });

            const questionElement = document.createElement('div');
            questionElement.className = 'question-card';
            // Store correct answer index and explanation in data attributes for later use
            questionElement.dataset.correctAnswer = q.correct_answer;
            questionElement.dataset.explanation = q.explanation;
            
            questionElement.innerHTML = `
                <p class="question-text"><strong>Questão ${index + 1}:</strong> ${q.question}</p>
                <div class="options-container">${optionsHTML}</div>
                <button class="check-answer-btn">Verificar Resposta</button>
                <div class="explanation" style="display: none;"></div>
            `;
            
            questionsContainer.appendChild(questionElement);
        });
    }

    // Use event delegation to handle clicks on all "Check Answer" buttons
    questionsContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('check-answer-btn')) {
            const card = event.target.closest('.question-card');
            const explanationDiv = card.querySelector('.explanation');
            const options = card.querySelectorAll('input[type="radio"]');
            const correctAnswerIndex = parseInt(card.dataset.correctAnswer, 10);
            const explanationText = card.dataset.explanation;

            let selectedAnswerIndex = -1;
            options.forEach((opt, i) => {
                if (opt.checked) {
                    selectedAnswerIndex = i;
                }
            });

            if (selectedAnswerIndex === -1) {
                alert("Por favor, selecione uma resposta antes de verificar.");
                return;
            }

            // Show feedback
            if (selectedAnswerIndex === correctAnswerIndex) {
                explanationDiv.innerHTML = `<p style="color: green;"><strong>Resposta Correta!</strong></p><p><strong>Explicação:</strong> ${explanationText}</p>`;
            } else {
                explanationDiv.innerHTML = `<p style="color: red;"><strong>Resposta Incorreta.</strong></p><p><strong>Explicação:</strong> ${explanationText}</p>`;
            }
            
            explanationDiv.style.display = 'block';
            event.target.style.display = 'none'; // Hide button after click
        }
    });
});