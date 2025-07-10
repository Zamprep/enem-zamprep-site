// This function initializes the Clerk parts of the page
async function initializeClerk() {
    const Clerk = window.Clerk;
    if (!Clerk) { return; }
    
    try {
        await Clerk.load();
        const contentWrapper = document.querySelector('.content-wrapper');
        const spinner = document.getElementById('loading-spinner');
        const userButton = document.getElementById('user-button');

        if (Clerk.user) {
            if (spinner) spinner.style.display = 'none';
            if (contentWrapper) contentWrapper.style.display = 'block';
            if (userButton) Clerk.mountUserButton(userButton);
            initializeDashboardFeatures(); // Run page features only if logged in
        } else {
            window.location.href = "https://zamprep.com/pt-br/sign-in.html";
        }
    } catch (err) {
        console.error("Clerk Error on ENEM Page:", err);
    }
}

// This function sets up all the interactive parts of the dashboard
function initializeDashboardFeatures() {
    // Countdown Clock Logic
    // ... your existing correct countdown logic ...
    
    // Priority Table Logic
    // ... your existing correct priority table logic ...

    // AI Essay Analysis Logic
    // ... your existing correct essay analysis logic ...
}

// Load Clerk and then initialize the page
const clerkScript = document.createElement('script');
clerkScript.async = true;
clerkScript.src = `https://distinct-ant-32.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
clerkScript.setAttribute('data-clerk-publishable-key', 'pk_test_ZGlzdGluY3QtYW50LTMyLmNsZXJrLmFjY291bnRzLmRldiQ');
clerkScript.addEventListener('load', initializeClerk);
document.head.appendChild(clerkScript);

// Run non-Clerk dependent logic once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Any logic that doesn't need the user to be logged in can go here
});