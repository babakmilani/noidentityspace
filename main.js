// main.js - Central JavaScript entry point for general site functionality.

// Import necessary modules
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

// --- Newsletter Form Handling ---

/**
 * Handles the newsletter form submission using the Apps Script endpoint.
 */
function handleNewsletterSubmission(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Get or create response message element
    let responseMessage = form.querySelector('.message-box');
    if (!responseMessage) {
        responseMessage = document.createElement('div');
        responseMessage.className = 'message-box';
        form.appendChild(responseMessage);
    }

    if (!submitBtn) {
        console.error("Newsletter submit button not found");
        return;
    }

    // Configuration check
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE" || !APPS_SCRIPT_URL.includes('script.google.com')) {
        showError(responseMessage, submitBtn, "Configuration Error: The Apps Script URL has not been set correctly in config.js.");
        return;
    }

    // --- Start Submission State ---
    responseMessage.style.display = 'none';
    responseMessage.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    const formData = new FormData(form);
    // Add formType to differentiate from contact form
    formData.append('formType', 'newsletter');

    // Convert FormData to URLSearchParams for Apps Script compatibility
    const params = new URLSearchParams(formData);

    // --- Fetch Request to Apps Script ---
    let retries = 0;

    const attemptSubmission = () => {
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: params
        })
            .then(response => response.text())
            .then(text => {
                if (text === 'success') {
                    showSuccess(responseMessage, submitBtn);
                    form.reset();
                } else {
                    // Handle errors returned by the Apps Script
                    throw new Error(`Subscription failed. Apps Script response: ${text}`);
                }
            })
            .catch(error => {
                if (retries < MAX_RETRIES) {
                    retries++;
                    const delay = Math.pow(2, retries) * 1000; // Exponential delay
                    setTimeout(attemptSubmission, delay);
                } else {
                    // Max retries reached, show error
                    console.error('Submission Error:', error);
                    showError(responseMessage, submitBtn, "We couldn't subscribe your email. Please verify your internet connection and try again.");
                }
            });
    };

    attemptSubmission();
}

/**
 * Shows success message
 */
function showSuccess(messageElement, submitBtn) {
    messageElement.className = 'message-box message-success';
    messageElement.innerHTML = '<strong>Success!</strong> You have been subscribed to our newsletter!';
    messageElement.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
}

/**
 * Shows error message
 */
function showError(messageElement, submitBtn, message) {
    messageElement.className = 'message-box message-error';
    messageElement.innerHTML = `<strong>Error!</strong> ${message}`;
    messageElement.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
}

/**
 * Sets up the newsletter form listener.
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmission);
        console.log('Newsletter form listener attached');
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

    // Setup the newsletter form
    setupNewsletterForm();
});