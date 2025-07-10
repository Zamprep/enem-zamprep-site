// This script contains logic specific to the ENEM Dashboard (countdown and essay analysis).
// It assumes Clerk.js is already loaded by the global /script.js or an inline script.

document.addEventListener('DOMContentLoaded', function() {

    // --- Countdown Clock Logic ---
    const daysEl = document.getElementById('days');
    const daysLabelEl = document.querySelector('.days-label');
    const examDatesEl = document.querySelector('.exam-dates');
    const countdownClockEl = document.getElementById('countdown-clock-V2'); // Main container for V2

    // This code only runs if the countdown clock elements are on the page
    if (daysEl && daysLabelEl && examDatesEl && countdownClockEl) {

        // Set the exact exam dates for ENEM 2025 in Brazil/Belo_Horizonte timezone
        // November 2, 2025 at 13:30 (1:30 PM)
        const examDate1 = new Date('2025-11-02T13:30:00-03:00');
        // November 9, 2025 at 13:30 (1:30 PM)
        const examDate2 = new Date('2025-11-09T13:30:00-03:00');

        function updateCountdown() {
            const now = new Date();
            let distance;
            let currentLabel = 'Dias Restantes';
            let currentExamDatesText = 'Datas do Exame: 2 e 9 de Novembro, 2025';

            if (now < examDate1) {
                // Before the first exam day
                distance = examDate1 - now;
                currentLabel = 'Dias Restantes';
            } else if (now >= examDate1 && now < examDate2) {
                // Between the first and second exam day
                distance = examDate2 - now;
                currentLabel = 'PRÓXIMA PROVA EM BREVE!';
                currentExamDatesText = 'Próxima prova: 9 de Novembro, 2025';
            } else {
                // After the second exam day
                distance = -1; // Indicate exam is over
            }

            if (distance < 0) {
                // If the exam date(s) have passed
                daysEl.textContent = '0';
                daysLabelEl.textContent = 'EXAME CONCLUÍDO!';
                examDatesEl.textContent = 'Parabéns por sua dedicação! Aguarde as datas de 2026.';
                // Stop updating
                clearInterval(countdownInterval); 
            } else {
                // Calculate and display only the days remaining
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                daysEl.textContent = days;
                daysLabelEl.textContent = currentLabel;
                examDatesEl.textContent = currentExamDatesText;

                // For more precise "Hoje é o ENEM!" (if desired), compare 'now' to examDate1/2 day-only
                // This logic could be expanded to also show hours/minutes/seconds if you adjust HTML
                if (days === 0 && now.toDateString() === examDate1.toDateString() && now < examDate1) {
                    daysLabelEl.textContent = 'HOJE É O ENEM!';
                } else if (days === 0 && now.toDateString() === examDate2.toDateString() && now < examDate2) {
                    daysLabelEl.textContent = 'HOJE É A SEGUNDA PROVA DO ENEM!';
                }
            }
        }

        // Update countdown initially and then every second for precise display
        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000); // Update every second
    }
    
    // --- AI Essay Analysis Logic ---

    // IMPORTANT: Replace this placeholder with your actual Worker URL
    const workerUrl = 'https://enem-analyzer.alfzamprep.workers.dev'; 

    const analyzeButton = document.getElementById('analyze-button');
    const essayInput = document.getElementById('essay-input');
    const resultsContainer = document.getElementById('analysis-results');
    const resultsContent = document.getElementById('results-content');

    // This code only runs if the analysis button is on the page
    if (analyzeButton && essayInput && resultsContainer && resultsContent) {
        analyzeButton.addEventListener('click', async function() {
            const essayText = essayInput.value;

            if (essayText.trim().length < 50) {
                alert("Por favor, insira uma redação com pelo menos 50 caracteres.");
                essayInput.focus(); // Focus on the input for user convenience
                return;
            }

            // Show loading state
            analyzeButton.innerText = 'Analisando...';
            analyzeButton.disabled = true;
            essayInput.disabled = true; // Disable textarea during analysis
            resultsContainer.style.display = 'none'; // Hide previous results

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ essay: essayText }),
                });

                if (!response.ok) {
                    // Attempt to parse error message from response body
                    let errorMsg = 'Houve um erro ao analisar sua redação. Por favor, tente novamente.';
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (jsonError) {
                        // If response is not JSON, use generic message
                        console.error('Failed to parse error response:', jsonError);
                    }
                    throw new Error(errorMsg);
                }

                const data = await response.json();

                // Build the results HTML
                let resultsHTML = `
                    <h3>Resultados da Análise</h3>
                    <h4>Nota Total: ${data.nota_total}/1000</h4>
                    <p><strong>Feedback Geral:</strong> ${data.feedback_geral}</p>
                    <hr>
                `;

                // Assuming data.feedback_competencias is an array
                if (data.feedback_competencias && Array.isArray(data.feedback_competencias)) {
                    data.feedback_competencias.forEach(item => {
                        resultsHTML += `
                            <div class="competence-feedback">
                                <strong>${item.competencia}:</strong>
                                <p>Nota: ${item.nota}/200</p>
                                <p>Análise: ${item.analise}</p>
                            </div>
                            <hr>
                        `;
                    });
                } else {
                    resultsHTML += `<p>Não foi possível obter o feedback detalhado das competências.</p>`;
                }
                
                // Display the results
                resultsContent.innerHTML = resultsHTML;
                resultsContainer.style.display = 'block';

                // Scroll to the results section
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } catch (error) {
                console.error('Erro na análise de redação:', error);
                resultsContent.innerHTML = `<p style="color: red;">${error.message}</p>`;
                resultsContainer.style.display = 'block';
            } finally {
                // Restore button and textarea state
                analyzeButton.innerText = 'Analisar Minha Redação';
                analyzeButton.disabled = false;
                essayInput.disabled = false;
            }
        });
    }
});
