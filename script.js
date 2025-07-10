document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Clerk Configuration ---
    const CLERK_PUBLISHABLE_KEY = "pk_test_bW9yYWwtYm9hLTM4LmNsZXJrLmFjY291bnRzLmRldiQ";
    const CLERK_SCRIPT_URL = `https://moral-boa-38.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    
    // --- Sitewide Menu Logic ---
    // (This part is correct and remains the same)
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', () => {
            const isVisible = navMenu.getAttribute('data-visible') === 'true';
            navMenu.setAttribute('data-visible', !isVisible);
        });
    }

    const langButton = document.querySelector('.language-button');
    const dropdownContent = document.querySelector('.dropdown-content');
    if (langButton && dropdownContent) {
        langButton.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
    }
    document.addEventListener('click', (event) => {
        if (langButton && !langButton.contains(event.target) && dropdownContent && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove('show');
        }
    });

    // --- Clerk Initialization ---
    // This function runs after the Clerk script from the HTML has loaded
    window.startClerk = async function() {
        const Clerk = window.Clerk;
        if (!Clerk) { return; }

        try {
            await Clerk.load();
            
            const path = window.location.pathname;
            const mountPoint = document.getElementById('clerk-component');
            const pageLang = document.documentElement.lang || 'en';

            // --- THIS IS THE CORRECTED LOGIC ---
            // It now checks for URLs with OR without .html
            if (path.endsWith('/sign-in') || path.endsWith('/sign-in.html')) {
                if (mountPoint) Clerk.mountSignIn(mountPoint);
            } else if (path.endsWith('/sign-up') || path.endsWith('/sign-up.html')) {
                const redirectUrl = pageLang.startsWith('en') ? '/en/onboarding.html' : '/pt-br/onboarding.html';
                if (mountPoint) Clerk.mountSignUp(mountPoint, { afterSignUpUrl: redirectUrl });
            }
            // --- END OF CORRECTION ---

            // This part updates the header on every page
            updateHeader(Clerk);
            Clerk.addListener(({ user }) => updateHeader(Clerk));

        } catch (err) {
            console.error("Clerk Error:", err);
        }
    }
    
    // This function physically changes the header elements
    function updateHeader(Clerk) {
        const user = Clerk.user;
        const loginLink = document.querySelector('a[href*="sign-in.html"]');
        const signupButton = document.querySelector('a.cta-button');
        const navList = document.querySelector('.nav-menu ul');
        
        if (!navList) return; // Don't run this logic on auth pages with no main nav

        const accountLink = navList.querySelector('a[href*="account-dashboard.html"]');

        if (user) {
            // User is logged in
            if (loginLink) loginLink.parentElement.style.display = 'none';
            if (signupButton) signupButton.style.display = 'none';
            
            if (!accountLink) {
                const myAccountItem = document.createElement('li');
                const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'pt-br';
                myAccountItem.innerHTML = `<a href="/${lang}/account-dashboard.html">${lang === 'en' ? 'My Account' : 'Minha Conta'}</a>`;
                navList.appendChild(myAccountItem);
            }
        } else {
            // User is logged out
            if (loginLink) loginLink.parentElement.style.display = 'list-item';
            if (signupButton) signupButton.style.display = 'inline-flex';
            if (accountLink) accountLink.parentElement.remove();
        }
    }
});