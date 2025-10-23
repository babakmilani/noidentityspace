// main.js - Central JavaScript entry point for general site functionality.

// 🚨 CRITICAL FIX: Import the root CSS file here so Vite can process and include it.
import './styles.css';
import { APPS_SCRIPT_URL } from './config.js'; // Import the Apps Script URL

/**
 * Toggles the mobile navigation menu's visibility.
 * This function is exposed globally via 'window.' because it's called from inline HTML (onclick="toggleMenu()").
 */
window.toggleMenu = function () {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

/**
 * Handles the newsletter/community subscription form submission using the Apps Script endpoint.
 */
function handleNewsletterSubmission(e) {
    e.preventDefault();
    console.log('📧 Newsletter form submitted!');

    const form = e.target;
    const submitBtn = document.getElementById('newsletterSubmitBtn');
    const communityBox = form.closest('.community-box') || form.closest('.sidebar-section');

    if (!submitBtn) {
        console.error("❌ Newsletter submit button not found");
        return;
    }

    // Basic URL validation - check if URL looks like a proper Apps Script URL
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE" || !APPS_SCRIPT_URL.includes('script.google.com')) {
        console.error("❌ Apps Script URL not configured properly:", APPS_SCRIPT_URL);
        handleSubmissionError(communityBox, "Configuration Error: The Apps Script URL is not set correctly.");
        return;
    }

    console.log('✅ Apps Script URL configured:', APPS_SCRIPT_URL);

    // --- Start Submission State ---
    // Store original content to restore on error
    const originalHTML = communityBox.innerHTML;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    communityBox.style.opacity = '0.7'; // Visual feedback

    const formData = new FormData(form);

    // ⭐ CRITICAL FIX: Add formType parameter for Apps Script to differentiate newsletter from contact
    formData.append('formType', 'newsletter');

    // Convert FormData to URLSearchParams for Apps Script compatibility
    const params = new URLSearchParams(formData);

    console.log('📤 Sending data:', Object.fromEntries(params));

    // --- Fetch Request to Apps Script with Exponential Backoff ---
    const MAX_RETRIES = 3;
    let retries = 0;

    const attemptSubmission = () => {
        console.log(`🔄 Attempt ${retries + 1}/${MAX_RETRIES + 1}`);

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: params
        })
            .then(response => {
                console.log('📥 Response received:', response);
                return response.text();
            })
            .then(text => {
                console.log('📄 Response text:', text);

                if (text === 'success') {
                    console.log('✅ Success!');
                    handleSubmissionSuccess(communityBox);
                } else {
                    // Check for Apps Script specific error response
                    let errorMessage = "Subscription failed. Please try again.";
                    if (text.includes("error:")) {
                        errorMessage = text.replace("error: ", "");
                    }
                    console.error('❌ Error response:', errorMessage);
                    throw new Error(errorMessage);
                }
            })
            .catch(error => {
                console.error('❌ Fetch error:', error);

                if (retries < MAX_RETRIES) {
                    retries++;
                    const delay = Math.pow(2, retries) * 1000; // Exponential delay (2s, 4s, 8s)
                    console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                    setTimeout(attemptSubmission, delay);
                } else {
                    // Max retries reached, show error
                    console.error('❌ Max retries reached. Submission failed.');
                    handleSubmissionError(communityBox, "We couldn't process your request. Please try again later.");
                    // Restore the original state on max error after delay
                    setTimeout(() => {
                        communityBox.innerHTML = originalHTML; // Re-create the form structure
                        setupNewsletterFormListener(); // Re-attach listener
                    }, 3000);
                }
            })
            .finally(() => {
                // Only update UI if not retrying
                if (retries >= MAX_RETRIES) {
                    communityBox.style.opacity = '1';
                }
            });
    };

    attemptSubmission();
}

/**
 * Displays a success message in the community box by replacing its content.
 * @param {HTMLElement} communityBox - The container element.
 */
function handleSubmissionSuccess(communityBox) {
    communityBox.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h3 style="color: var(--white); font-size: 1.5rem; margin-bottom: 0.5rem;">🎉 You're Subscribed!</h3>
            <p style="color: var(--white);">Thank you for joining the community. Check your email to confirm your subscription!</p>
        </div>
    `;
}

/**
 * Displays a temporary error message in the community box.
 * @param {HTMLElement} communityBox - The container element.
 * @param {string} message - The error message.
 */
function handleSubmissionError(communityBox, message) {
    // Find where to insert the error message (e.g., at the top of the box content)
    const container = communityBox.querySelector('.container') || communityBox;

    let errorDiv = container.querySelector('.newsletter-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'newsletter-error-message';
        errorDiv.style.padding = '1rem';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.marginBottom = '1rem';
        errorDiv.style.border = '2px solid white';
        container.prepend(errorDiv);
    }

    errorDiv.innerHTML = `<strong>Error!</strong> ${message}`;
    errorDiv.style.display = 'block';

    // Remove the error message after a few seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 5000);
}


/**
 * Sets up the event listener for the newsletter form.
 */
function setupNewsletterFormListener() {
    const newsletterForm = document.getElementById('newsletterForm');

    console.log('🔍 Looking for newsletter form...');

    if (newsletterForm) {
        console.log('✅ Newsletter form found!');

        // Remove any existing listeners by cloning and replacing the form
        const newForm = newsletterForm.cloneNode(true);
        newsletterForm.parentNode.replaceChild(newForm, newsletterForm);

        // Add the submit event listener
        newForm.addEventListener('submit', handleNewsletterSubmission);
        console.log('✅ Newsletter form listener attached successfully');
    } else {
        console.warn('⚠️ Newsletter form not found on this page');
    }
}


/**
 * Enables smooth scrolling for all anchor links on the page and sets up the newsletter form.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page loaded, initializing...');

    // Setup smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu if open
                const navLinks = document.getElementById('navLinks');
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // Setup the newsletter form listener for index.html
    setupNewsletterFormListener();
});