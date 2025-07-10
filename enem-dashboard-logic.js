// This function waits for the Clerk object to be ready
function startClerkWhenReady() {
    const Clerk = window.Clerk;

    if (Clerk && Clerk.load) {
        // Clerk is available, let's initialize the page
        initializePage();
    } else {
        // If Clerk is not ready yet, wait a moment and try again
        setTimeout(startClerkWhenReady, 100);
    }
}

// This function runs all the logic for our page
function initializePage() {
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
            initializeDashboardFeatures();

        } else {
            // If user is not logged in, redirect them to the MAIN site's sign-in page
            window.location.href = "https://zamprep.com/pt-br/sign-in.html"; 
        }
    });
}

// This function sets up all the interactive parts of the dashboard
function initializeDashboardFeatures() {
    
    // --- Countdown Clock Logic ---
    const examDate = new Date('2025-11-02T13:30:00-03:00');
    const daysEl = document.getElementById('days');
    const countdownContainer = document.getElementById('countdown-container');

    if (daysEl && countdownContainer) {
        const now = new Date();
        const distance = examDate - now;

        if (distance < 0) {
            countdownContainer.innerHTML = "<h2>O ENEM 2025 já passou! Parabéns pela sua dedicação!</h2>";
        } else {
            const days = Math.ceil(distance / (1000 * 60 * 60 * 24));
            daysEl.innerText = days;
        }
    }
    
    // --- Priority Table Logic (Placeholder) ---
    const priorityContainer = document.getElementById('priority-container');
    const priorityTable = document.getElementById('priority-table');
    const userWeakness = 'redacao';

    if (priorityContainer && priorityTable) {
        const topics = [
            { id: 'redacao', name: 'Redação' },
            { id: 'matematica', name: 'Matemática' },
            { id: 'humanas', name: 'Ciências Humanas' },
            { id: 'natureza', name: 'Ciências da Natureza' },
            { id: 'linguagens', name: 'Linguagens e Códigos' }
        ];

        const sortedTopics = topics.sort((a, b) => {
            if (a.id === userWeakness) return -1;
            if (b.id === userWeakness) return 1;
            return 0;
        });
        
        priorityTable.innerHTML = '';
        
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
    const workerUrl = 'https://enem-analyzer.alf-zamprep.workers.dev/';
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
            resultsContainer.innerHTML = '';

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ essay: essayText }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Houve um erro na análise. Tente novamente.');
                }
                
                let resultsHTML = `<h3>Resultados da Análise</h3><h4>Nota Total: ${data.nota_total}/1000</h4><p><strong>Feedback Geral:</strong> ${data.feedback_geral}</p><hr>`;
                data.feedback_competencias.forEach(item => {
                    resultsHTML += `<div style="margin-bottom: 15px;"><strong>${item.competencia}:</strong><p style="margin: 5px 0;">Nota: ${item.nota}/200</p><p style="margin: 5px 0;">Análise: ${item.analise}</p></div><hr>`;
                });
                resultsContainer.innerHTML = resultsHTML;

            } catch (error) {
                resultsContainer.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
            } finally {
                resultsContainer.style.display = 'block';
                analyzeButton.innerText = 'Analisar Minha Redação';
                analyzeButton.disabled = false;
            }
        });
    }
}

// Start the process when the DOM is ready
document.addEventListener('DOMContentLoaded', startClerkWhenReady);