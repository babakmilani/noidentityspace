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

        // Configuration check using the imported URL
        if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL" || APPS_SCRIPT_URL.length < 50) {
            handleError("Configuration Error: The Apps Script URL has not been set correctly in config.js.");
            return;
        }

        // --- Start Submission State ---
        responseMessage.style.display = 'none';
        responseMessage.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const formData = new FormData(form);
        // Convert FormData to URLSearchParams for Apps Script compatibility (key=value&key2=value2)
        const params = new URLSearchParams(formData);

        // --- Fetch Request to Apps Script ---
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: params
        })
            .then(response => {
                // Check for successful HTTP response (200-299 status code)
                if (response.ok) {
                    return response.text();
                } else {
                    // Throw an error for non-200 HTTP statuses
                    throw new Error(`Server error: ${response.status} (${response.statusText})`);
                }
            })
            .then(text => {
                // Check for the 'success' string returned by the Apps Script's doPost function
                if (text.includes("success")) {
                    handleSuccess();
                } else {
                    // Handle errors returned specifically by the Apps Script (e.g., missing fields)
                    throw new Error(`Form submission failed. Apps Script response: ${text}`);
                }
            })
            .catch(error => {
                console.error('Submission Error:', error);
                // Display a user-friendly error message
                handleError("We couldn't send your message. Please verify your internet connection and try again.");
            })
            .finally(() => {
                // --- End Submission State ---
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            });
    });

    /**
     * Handles a successful form submission, updating the UI.
     */
    function handleSuccess() {
        responseMessage.className = 'message-box message-success';
        responseMessage.innerHTML = '<strong>Success!</strong> Your message has been sent. We will get back to you soon.';
        responseMessage.style.display = 'block';
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
    }
});
