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
    // Assuming the form is contained in an element like .community-box on index.html
    // New (Fixed) line:
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
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    // Hide previous response messages
    communityBox.querySelectorAll('.response-message').forEach(el => el.style.display = 'none');


    const formData = new FormData(form);
    // CRITICAL: Explicitly set the formType to differentiate submissions in the Apps Script
    formData.append('formType', 'newsletter');

    // CONVERT to URLSearchParams, matching the successful method in contact.js
    const params = new URLSearchParams(formData).toString();

    let retries = 0;
    const attemptSubmission = () => {
        if (retries >= MAX_RETRIES) {
            handleSubmissionError(communityBox, "The server did not respond. Please try again later.");
            return;
        }

        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(() => {
                // Success is assumed due to 'no-cors' mode. Apps Script logic handles the actual data check.
                handleSubmissionSuccess(communityBox);
            })
            .catch(error => {
                retries++;
                console.warn(`Submission failed (Attempt ${retries}/${MAX_RETRIES}). Retrying in 2 seconds...`, error);
                setTimeout(attemptSubmission, 2000);
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