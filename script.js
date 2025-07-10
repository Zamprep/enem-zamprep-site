// This function will run after the page content has loaded
document.addEventListener('DOMContentLoaded', function() {

    // --- Countdown Clock Logic ---

    // Set the date for the FIRST day of the ENEM 2025 exam.
    const examDate = new Date('November 2, 2025 13:30:00 GMT-0300').getTime();
    
    const daysEl = document.getElementById('days');
    const countdownClockEl = document.getElementById('countdown-clock-V2');

    // This code only runs if the countdown clock elements are on the page
    if (daysEl && countdownClockEl) {
        const now = new Date().getTime();
        const distance = examDate - now;

        if (distance < 0) {
            // If the exam date has passed
            countdownClockEl.innerHTML = "<h3>O ENEM 2025 já passou! Parabéns por sua dedicação!</h3>";
        } else {
            // Calculate and display only the days remaining
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            daysEl.innerText = days;
        }
    }
    
    // --- AI Essay Analysis Logic ---

    // IMPORTANT: Replace this placeholder with your actual Worker URL
    const workerUrl = 'https://enem-analyzer.alfzamprep.workers.dev'; 

    const analyzeButton = document.getElementById('analyze-button');
    const essayInput = document.getElementById('essay-input');
    const resultsContainer = document.getElementById('analysis-results');
    const resultsContent = document.getElementById('results-content');

    // This code only runs if the analysis button is on the page
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async function() {
            const essayText = essayInput.value;

            if (essayText.trim().length < 50) {
                alert("Por favor, insira uma redação com pelo menos 50 caracteres.");
                return;
            }

            // Show loading state
            analyzeButton.innerText = 'Analisando...';
            analyzeButton.disabled = true;
            resultsContainer.style.display = 'none';

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ essay: essayText }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Houve um erro ao analisar sua redação. Por favor, tente novamente.');
                }

                const data = await response.json();

                // Build the results HTML
                let resultsHTML = `
                    <h4>Nota Total: ${data.nota_total}/1000</h4>
                    <p><strong>Feedback Geral:</strong> ${data.feedback_geral}</p>
                    <hr>
                `;

                data.feedback_competencias.forEach(item => {
                    resultsHTML += `
                        <div>
                            <strong>${item.competencia}:</strong>
                            <p>Nota: ${item.nota}/200</p>
                            <p>Análise: ${item.analise}</p>
                        </div>
                        <hr>
                    `;
                });

                // Display the results
                resultsContent.innerHTML = resultsHTML;
                resultsContainer.style.display = 'block';

            } catch (error) {
                resultsContent.innerHTML = `<p style="color: red;">${error.message}</p>`;
                resultsContainer.style.display = 'block';
            } finally {
                // Restore button state
                analyzeButton.innerText = 'Analisar Minha Redação';
                analyzeButton.disabled = false;
            }
        });
    }
});