// contact.js

// Import the Apps Script URL from the separate configuration file
import { APPS_SCRIPT_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const responseMessage = document.getElementById('responseMessage');

    if (!form || !submitBtn || !responseMessage) {
        console.error("Contact form elements not found. Check contact.html for IDs.");
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Configuration check - verify it's a valid Google Apps Script URL
        if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE" || !APPS_SCRIPT_URL.includes('script.google.com')) {
            handleError("Configuration Error: The Apps Script URL has not been set correctly in config.js.");
            return;
        }

        // --- Start Submission State ---
        responseMessage.style.display = 'none';
        responseMessage.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const formData = new FormData(form);
        // Explicitly set the formType to differentiate submissions in the Apps Script
        formData.append('formType', 'contact');

        // Convert FormData to URLSearchParams for Apps Script compatibility (key=value&key2=value2)
        const params = new URLSearchParams(formData);

        // --- Fetch Request to Apps Script ---
        const MAX_RETRIES = 3;
        let retries = 0;

        const attemptSubmission = () => {
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: params
            })
                .then(response => response.text())
                .then(text => {
                    if (text === 'success') {
                        handleSuccess();
                    } else {
                        // Handle errors returned specifically by the Apps Script (e.g., missing fields)
                        throw new Error(`Form submission failed. Apps Script response: ${text}`);
                    }
                })
                .catch(error => {
                    if (retries < MAX_RETRIES) {
                        retries++;
                        const delay = Math.pow(2, retries) * 1000; // Exponential delay (2s, 4s, 8s)
                        setTimeout(attemptSubmission, delay);
                    } else {
                        // Max retries reached, show error
                        console.error('Submission Error:', error);
                        handleError("We couldn't send your message. Please verify your internet connection and try again.");
                    }
                })
                .finally(() => {
                    // --- End Submission State ---
                    if (retries >= MAX_RETRIES) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Message';
                    }
                });
        };

        attemptSubmission();
    });

    /**
     * Handles a successful form submission, updating the UI.
     */
    function handleSuccess() {
        responseMessage.className = 'message-box message-success';
        responseMessage.innerHTML = '<strong>Success!</strong> Your message has been sent. We will get back to you soon.';
        responseMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        form.reset();
    }

    /**
     * Handles a failed form submission, updating the UI.
     * @param {string} message - The error message to display to the user.
     */
    function handleError(message) {
        responseMessage.className = 'message-box message-error';
        responseMessage.innerHTML = `<strong>Error!</strong> ${message}`;
        responseMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
});