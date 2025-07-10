// This function runs after the page content has loaded
document.addEventListener('DOMContentLoaded', function() {

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
    
    // --- AI Essay Analysis Logic ---
    const analyzeButton = document.getElementById('analyze-button');
    const essayInput = document.getElementById('essay-input');
    const resultsContainer = document.getElementById('analysis-results');

    if (analyzeButton) {
        analyzeButton.addEventListener('click', async function() {
            // Get the URL of the Worker from your Cloudflare Dashboard
            const workerUrl = 'https://enem-analyzer.alf-zamprep.workers.dev'; // Replace with your actual worker URL
            const essayText = essayInput.value;

            if (essayText.trim().length < 50) {
                alert("Por favor, insira uma redação com pelo menos 50 caracteres.");
                return;
            }

            // Show loading state
            analyzeButton.innerText = 'Analisando...';
            analyzeButton.disabled = true;
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = ''; // Clear previous results

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ essay: essayText }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Use the error from the backend if available, otherwise use a generic one
                    throw new Error(data.error || 'Houve um erro na análise. Tente novamente.');
                }
                
                // Build the results HTML from the successful response
                let resultsHTML = `
                    <h3>Resultados da Análise</h3>
                    <h4>Nota Total: ${data.nota_total}/1000</h4>
                    <p><strong>Feedback Geral:</strong> ${data.feedback_geral}</p>
                    <hr>
                `;

                data.feedback_competencias.forEach(item => {
                    resultsHTML += `
                        <div class="competence-feedback" style="margin-bottom: 15px;">
                            <strong>${item.competencia}:</strong>
                            <p style="margin: 5px 0;">Nota: ${item.nota}/200</p>
                            <p style="margin: 5px 0;">Análise: ${item.analise}</p>
                        </div>
                        <hr>
                    `;
                });

                resultsContainer.innerHTML = resultsHTML;

            } catch (error) {
                resultsContainer.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${error.message}</p>`;
            } finally {
                // Restore button and show results
                resultsContainer.style.display = 'block';
                analyzeButton.innerText = 'Analisar Minha Redação';
                analyzeButton.disabled = false;
            }
        });
    }
});