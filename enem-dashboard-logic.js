// This function is called by the Clerk script tag once it has fully loaded
function startClerk() {
    const Clerk = window.Clerk;

    Clerk.load().then(() => {
        const contentWrapper = document.querySelector('.content-wrapper');
        const userButton = document.getElementById('user-button');
        const loadingSpinner = document.getElementById('loading-spinner');

        // This code protects the page
        if (Clerk.user) {
            loadingSpinner.style.display = 'none';
            contentWrapper.style.display = 'block';
            Clerk.mountUserButton(userButton);
            
            // Now that we know the user is logged in, run all dashboard functions
            initializeDashboard();

        } else {
            // If user is not logged in, redirect them to the MAIN site's sign-in page
            window.location.href = "https://zamprep.com/pt-br/sign-in.html"; 
        }
    });
}

// This function sets up all the interactive parts of the dashboard
function initializeDashboard() {
    
    // --- Countdown Clock Logic ---
    const examDate = new Date('2025-11-02T13:30:00-03:00'); // More reliable date format
    const daysEl = document.getElementById('days');
    const countdownContainer = document.getElementById('countdown-container');

    if (daysEl && countdownContainer) {
        const now = new Date();
        const distance = examDate - now;

        if (distance < 0) {
            countdownContainer.innerHTML = "<h2>O ENEM 2025 já passou! Parabéns pela sua dedicação!</h2>";
        } else {
            const days = Math.ceil(distance / (1000 * 60 * 60 * 24)); // Use ceil for a more encouraging number
            daysEl.innerText = days;
        }
    }
    
    // --- Priority Table Logic (Example) ---
    // In the future, we will get this from the database. For now, it's a placeholder.
    const priorityContainer = document.getElementById('priority-container');
    const priorityTable = document.getElementById('priority-table');
    const userWeakness = 'redacao'; // This would come from the database

    if (priorityContainer && priorityTable) {
        const topics = [
            { id: 'redacao', name: 'Redação' },
            { id: 'matematica', name: 'Matemática' },
            { id: 'humanas', name: 'Ciências Humanas' },
            { id: 'natureza', name: 'Ciências da Natureza' },
            { id: 'linguagens', name: 'Linguagens e Códigos' }
        ];

        // Move the user's weakness to the top of the list
        const sortedTopics = topics.sort((a, b) => {
            if (a.id === userWeakness) return -1;
            if (b.id === userWeakness) return 1;
            return 0;
        });

        sortedTopics.forEach((topic, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'priority-item';
            if (topic.id === userWeakness) {
                listItem.classList.add('highlight');
            }
            listItem.innerHTML = `<span class="rank">#${index + 1}</span> <span>${topic.name}</span>`;
            priorityTable.appendChild(listItem);
        });

        priorityContainer.style.display = 'block';
    }


    // --- AI Essay Analysis Logic ---
    const workerUrl = 'https://enem-analyzer.alfzamprep.workers.dev/';
    const analyzeButton = document.getElementById('analyze-button');
    const essayInput = document.getElementById('essay-input');
    const resultsContainer = document.getElementById('analysis-results');

    if (analyzeButton) {
        analyzeButton.addEventListener('click', async function() {
            const essayText = essayInput.value;
            if (essayText.trim().length < 50) {
                alert("Por favor, insira uma redação com pelo menos 50 caracteres.");
                return;
            }

            analyzeButton.innerText = 'Analisando...';
            analyzeButton.disabled = true;
            resultsContainer.style.display = 'none';

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ essay: essayText }),
                });

                if (!response.ok) { throw new Error('Houve um erro na análise. Tente novamente.'); }

                const data = await response.json();
                let resultsHTML = `<h3>Resultados da Análise</h3><h4>Nota Total: ${data.nota_total}/1000</h4><p><strong>Feedback Geral:</strong> ${data.feedback_geral}</p><hr>`;
                data.feedback_competencias.forEach(item => {
                    resultsHTML += `<div><strong>${item.competencia}:</strong><p>Nota: ${item.nota}/200</p><p>Análise: ${item.analise}</p></div><hr>`;
                });
                resultsContainer.innerHTML = resultsHTML;
                resultsContainer.style.display = 'block';

            } catch (error) {
                resultsContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
                resultsContainer.style.display = 'block';
            } finally {
                analyzeButton.innerText = 'Analisar Minha Redação';
                analyzeButton.disabled = false;
            }
        });
    }
}