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

// --- Submission Utilities (Adapted from working contact.js) ---

/**
 * Utility function to handle submission errors and update the UI.
 */
function handleSubmissionError(container, message) {
    let responseMessage = container.querySelector('.response-message');
    if (!responseMessage) {
        responseMessage = document.createElement('p');
        responseMessage.classList.add('response-message');
        container.appendChild(responseMessage);
    }
    // Update classes and message display
    responseMessage.className = 'response-message message-error';
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
function handleSubmissionSuccess(container) {
    let responseMessage = container.querySelector('.response-message');
    if (!responseMessage) {
        responseMessage = document.createElement('p');
        responseMessage.classList.add('response-message');
        container.appendChild(responseMessage);
    }
    // Update classes and message display
    responseMessage.className = 'response-message message-success';
    responseMessage.innerHTML = '<strong>Success!</strong> You have subscribed to our newsletter.';
    responseMessage.style.display = 'block';

    const submitBtn = document.getElementById('newsletterSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
    }
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.reset();
    }
}

/**
 * Handles the newsletter form submission using the Apps Script endpoint.
 */
function handleNewsletterSubmission(e) {
    e.preventDefault();
    console.log('📧 Newsletter form submitted!');

    const form = e.target;
    const submitBtn = document.getElementById('newsletterSubmitBtn');
    // Find the closest container for error/success messages
    const communityBox = form.closest('.community-box') || form.closest('.sidebar-section') || form.parentElement;

    if (!submitBtn) {
        console.error("❌ Newsletter submit button not found");
        return;
    }

    // Configuration check (same as contact.js)
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_URL.includes('script.google.com')) {
        console.error("❌ Apps Script URL not configured properly:", APPS_SCRIPT_URL);
        handleSubmissionError(communityBox, "Configuration Error: The Apps Script URL is not set correctly.");
        return;
    }

    // --- Start Submission State ---
    // Hide previous response messages
    communityBox.querySelectorAll('.response-message').forEach(el => el.style.display = 'none');

    // Store original text
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';


    const formData = new FormData(form);
    // CRITICAL: Explicitly set the formType to differentiate submissions in the Apps Script
    formData.append('formType', 'newsletter');

    // CONVERT to URLSearchParams, matching the successful method in contact.js
    const params = new URLSearchParams(formData);

    let retries = 0;

    // Define the submission attempt function with retry logic
    const attemptSubmission = () => {
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: params, // Use the converted URLSearchParams object here
        })
            .then(response => response.text())
            .then(text => {
                if (text === 'success') {
                    handleSubmissionSuccess(communityBox);
                } else {
                    // Handle errors returned specifically by the Apps Script
                    throw new Error(`Form submission failed. Apps Script response: ${text}`);
                }
            })
            .catch(error => {
                if (retries < MAX_RETRIES) {
                    retries++;
                    const delay = Math.pow(2, retries) * 1000; // Exponential delay (2s, 4s, 8s)
                    console.warn(`⚠️ Submission failed. Retrying in ${delay / 1000}s... (Attempt ${retries}/${MAX_RETRIES})`);
                    setTimeout(attemptSubmission, delay);
                } else {
                    // Max retries reached, show error
                    console.error('Submission Error:', error);
                    handleSubmissionError(communityBox, "We couldn't subscribe your email. Please verify your internet connection and try again.");
                }
            })
            .finally(() => {
                // Restore button state on final failure (redundant with handleSubmissionError, but safer)
                if (retries >= MAX_RETRIES) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
    };

    attemptSubmission();
}

/**
 * Sets up the newsletter form listener.
 */
function setupNewsletterFormListener() {
    // Check both index.html and contact.html for the newsletter form (if it's in the footer of both)
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        // Remove any existing listeners by cloning and replacing the form
        const newForm = newsletterForm.cloneNode(true);
        newsletterForm.parentNode.replaceChild(newForm, newsletterForm);

        // Add the submit event listener
        newForm.addEventListener('submit', handleNewsletterSubmission);
    }
}


/**
 * Enables smooth scrolling and sets up form listeners.
 */
document.addEventListener('DOMContentLoaded', () => {

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