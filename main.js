// main.js - Central JavaScript entry point for general site functionality.

// Import necessary modules
import './styles.css';
import { APPS_SCRIPT_URL } from './config.js';

// Max retries for fetch operations
const MAX_RETRIES = 3;

// --- Global Functions ---

/**
 * Toggles the mobile navigation menu's visibility.
 */
window.toggleMenu = function () {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// --- Submission Utilities ---

/**
 * Utility function to handle submission errors and update the UI.
 */
function handleSubmissionError(form, message) {
    let responseMessage = form.querySelector('.message-box');

    if (!responseMessage) {
        responseMessage = document.createElement('div');
        responseMessage.className = 'message-box';
        form.appendChild(responseMessage);
    }

    responseMessage.className = 'message-box message-error';
    responseMessage.innerHTML = `<strong>Error!</strong> ${message}`;
    responseMessage.style.display = 'block';

    const submitBtn = document.getElementById('newsletterSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
    }
}

/**
 * Utility function to handle successful submission and update the UI.
 */
function handleSubmissionSuccess(form) {
    let responseMessage = form.querySelector('.message-box');

    if (!responseMessage) {
        responseMessage = document.createElement('div');
        responseMessage.className = 'message-box';
        form.appendChild(responseMessage);
    }

    responseMessage.className = 'message-box message-success';
    responseMessage.innerHTML = '<strong>Success!</strong> You have subscribed to our newsletter. Check your email to confirm!';
    responseMessage.style.display = 'block';

    const submitBtn = document.getElementById('newsletterSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
    }

    form.reset();
}

/**
 * Handles the newsletter form submission using the Apps Script endpoint.
 */
function handleNewsletterSubmission(e) {
    e.preventDefault();
    console.log('📧 Newsletter form submitted!');

    const form = e.target;
    const submitBtn = document.getElementById('newsletterSubmitBtn');
    const responseMessage = form.querySelector('.response-message');

    if (!submitBtn) {
        console.error("❌ Newsletter submit button not found");
        return;
    }

    // Configuration check
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_URL.includes('script.google.com')) {
        console.error("❌ Apps Script URL not configured properly:", APPS_SCRIPT_URL);
        handleSubmissionError(form, "Configuration Error: The Apps Script URL is not set correctly.");
        return;
    }

    console.log('✅ Apps Script URL configured:', APPS_SCRIPT_URL);

    // --- Start Submission State ---
    if (responseMessage) {
        responseMessage.style.display = 'none';
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    const formData = new FormData(form);
    // CRITICAL: Add formType parameter
    formData.append('formType', 'newsletter');

    // Convert to URLSearchParams for Apps Script compatibility
    const params = new URLSearchParams(formData);

    console.log('📤 Sending data:', Object.fromEntries(params));

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
                    handleSubmissionSuccess(form);
                } else {
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
                    const delay = Math.pow(2, retries) * 1000;
                    console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                    setTimeout(attemptSubmission, delay);
                } else {
                    console.error('❌ Max retries reached. Submission failed.');
                    handleSubmissionError(form, "We couldn't subscribe your email. Please check your connection and try again.");
                }
            });
    };

    attemptSubmission();
}

/**
 * Sets up the newsletter form listener.
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
 * Enables smooth scrolling and sets up form listeners.
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

    // Setup the newsletter form listener
    setupNewsletterFormListener();
});