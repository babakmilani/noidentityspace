// main.js - Central JavaScript entry point for general site functionality.

// 🚨 CRITICAL FIX: Import the root CSS file here so Vite can process and include it.
import './styles.css';


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
 * Handles the newsletter/community subscription form submission.
 * In a real application, this should use a fetch request to a subscription service.
 * @param {Event} e - The form submission event.
 */
window.handleSubmit = function (e) {
    e.preventDefault();
    const form = e.target;

    // Find the container for the community section
    const communityBox = form.closest('.community-box');

    // Simulate subscription success
    console.log('Subscription form submitted. Data:', new FormData(form));

    if (communityBox) {
        // Simple UI swap to show success instead of using alert()
        // We replace the form content with a success message
        communityBox.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3 style="color: #6366f1; font-size: 1.5rem; margin-bottom: 0.5rem;">🎉 You're Subscribed!</h3>
                <p>Check your email to confirm your subscription and start receiving exclusive privacy tips.</p>
            </div>
        `;
    } else {
        // Fallback for when the dedicated success element is missing
        console.log('Thank you for subscribing! Success message element not found, but submission simulated.');
        form.reset();
    }
}

/**
 * Enables smooth scrolling for all anchor links on the page.
 */
document.addEventListener('DOMContentLoaded', () => {
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
});
