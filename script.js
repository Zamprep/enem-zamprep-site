// This function will run after the page content has loaded
document.addEventListener('DOMContentLoaded', function() {

    // --- Countdown Clock Logic ---

    // Set the date for the ENEM 2025 exam.
    // Note: This is a placeholder date based on previous years. We can update it when the official date is released.
    const examDate = new Date('November 2, 2025 13:30:00 GMT-0300').getTime();

    // Update the clock every second
    const countdownInterval = setInterval(function() {
        // Get today's date and time
        const now = new Date().getTime();

        // Find the distance between now and the exam date
        const distance = examDate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the HTML
        document.getElementById('days').innerText = days;
        document.getElementById('hours').innerText = hours;
        document.getElementById('minutes').innerText = minutes;
        document.getElementById('seconds').innerText = seconds;

        // If the countdown is finished, display a message
        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown-clock').innerHTML = "<h3>O dia do exame chegou! Boa sorte!</h3>";
        }
    }, 1000);

});