// javaScript/customer-service.js
import { fetchUserData, sendSupportTicket } from './apiService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loggedInView = document.getElementById('logged-in-view');
    const loggedOutView = document.getElementById('logged-out-view');
    const supportForm = document.getElementById('support-form');

    const userToken = localStorage.getItem('userAuthToken');

    if (!userToken) {
        loggedOutView.classList.remove('hidden');
        loggedInView.classList.add('hidden');
        return;
    }

    try {
        const userData = await fetchUserData();
        if (userData && userData.name && userData.email) {
            document.getElementById('user-name').textContent = userData.name;
            document.getElementById('user-email').textContent = userData.email;
            loggedOutView.classList.add('hidden');
            loggedInView.classList.remove('hidden');
        } else {
            // Failsafe if token is present but user data is invalid
            throw new Error("Invalid user data received.");
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        loggedOutView.classList.remove('hidden');
        loggedInView.classList.add('hidden');
        localStorage.clear(); // Clear invalid auth data
    }

    if (supportForm) {
        supportForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            const feedbackDiv = document.getElementById('form-feedback');
            
            const category = event.target.elements.category.value;
            const message = event.target.elements.message.value;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Sending...</span>
            `;
            feedbackDiv.textContent = '';
            feedbackDiv.className = 'mt-4 text-center';

            try {
                await sendSupportTicket(category, message);
                feedbackDiv.textContent = "Your message has been sent successfully! Our team will get back to you shortly.";
                feedbackDiv.classList.add('text-green-600');
                supportForm.reset();
            } catch (error) {
                feedbackDiv.textContent = `Error: ${error.message}`;
                feedbackDiv.classList.add('text-red-600');
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <i class="fas fa-paper-plane"></i>
                    <span>Send Message</span>
                `;
            }
        });
    }
});