// javascript/signin.js

import { fetchUserData, requestPasswordReset, verifyOtp, verifyOtpAndReset, sendSignupOtp, createAccount } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- FORM & ELEMENT REFERENCES ---
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const emailStage = document.getElementById('email-stage');
    const otpVerificationStage = document.getElementById('otp-verification-stage');
    const newPasswordStage = document.getElementById('new-password-stage');

    const messageDiv = document.getElementById('message');
    const toggleLink = document.getElementById('toggle-link');
    const signinToggleText = document.getElementById('signin-toggle-text');
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');
    const toggleContainer = document.getElementById('toggle-container');

    let isSignIn = true;
    
    // AUTOMATIC SWITCH: If running on 127.0.0.1 or localhost, use local backend. Otherwise, use Render.
    const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
        ? 'http://localhost:3000' 
        : 'https://nexsusmarket.onrender.com';

    // Debug check to see which one is being used
    console.log("Current Backend URL:", API_URL);

    // --- ⭐ NEW: Loading Animation Function ---
    let loadingInterval = null;
    function startLoadingAnimation(button, baseText = "Processing") {
        let dotCount = 0;
        if (loadingInterval) clearInterval(loadingInterval); // Clear previous interval
        button.disabled = true;
        // Store original text if it's not already stored
        if (!button.dataset.originalText) {
             button.dataset.originalText = button.textContent;
        }
        loadingInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            button.textContent = baseText + '.'.repeat(dotCount);
        }, 400);
    }

    function stopLoadingAnimation(button, restoreText = null) {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
         // Use provided restoreText, then originalText, then default if necessary
        button.textContent = restoreText || button.dataset.originalText || 'Submit';
        button.disabled = false;
        // Clear stored original text after use
        // delete button.dataset.originalText;
    }
    // --- ⭐ END OF NEW FUNCTION ---

    // --- PASSWORD VISIBILITY TOGGLE ---
    document.querySelectorAll('.toggle-password-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const passwordInput = icon.previousElementSibling;
            if (passwordInput && passwordInput.tagName === 'INPUT') {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                icon.classList.toggle('fa-eye-slash');
                icon.classList.toggle('fa-eye');
            }
        });
    });

    // --- HELPER FUNCTION TO SWITCH TO SIGN-IN VIEW ---
    function showSignInView() {
        isSignIn = true;
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
        forgotPasswordForm.style.display = 'none';
        toggleContainer.style.display = 'block';

        formTitle.textContent = 'Sign In';
        formDescription.textContent = 'Enter your credentials to access your account.';
        signinToggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
    }

    // --- FORM TOGGLE LOGIC ---
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isSignIn = !isSignIn;
        if (isSignIn) {
            showSignInView();
        } else {
            signinForm.style.display = 'none';
            signupForm.style.display = 'block';
            forgotPasswordForm.style.display = 'none';
            formTitle.textContent = 'Create Account';
            formDescription.textContent = 'Join NexusMarket to start your shopping journey.';
            signinToggleText.textContent = 'Already have an account?';
            toggleLink.textContent = 'Sign In';
        }
        messageDiv.textContent = '';

        // Stop any active loading animation when toggling forms
        if (loadingInterval) {
            const loadingButton = document.querySelector('button[disabled]'); // Find potentially loading button
            if (loadingButton) {
                stopLoadingAnimation(loadingButton); // Restore its original text
            } else {
                 clearInterval(loadingInterval); // Fallback clear
                 loadingInterval = null;
            }
        }
    });

    // --- 1. HANDLE SIGN UP ---
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const createAccountBtn = document.getElementById('create-account-btn');
    const signupVerificationStage = document.getElementById('signup-verification-stage');
    const signupNameInput = document.getElementById('signup-name');
    const signupPhoneInput = document.getElementById('signup-phone');
    const signupEmailInput = document.getElementById('signup-email');

    if (sendOtpBtn) {
        sendOtpBtn.dataset.originalText = sendOtpBtn.textContent; // Store initial text
        sendOtpBtn.addEventListener('click', async () => {
            const name = signupNameInput.value;
            const phone = signupPhoneInput.value;
            const email = signupEmailInput.value;

            if (!name || !phone || !email) {
                messageDiv.textContent = 'Please fill in your name, phone, and email.';
                messageDiv.style.color = 'red';
                return;
            }
            if (!/^\d{10}$/.test(phone)) {
                messageDiv.textContent = 'Please enter a valid 10-digit mobile number.';
                messageDiv.style.color = 'red';
                return;
            }

            messageDiv.textContent = '';
            startLoadingAnimation(sendOtpBtn, "Sending"); // ⭐ Start loading

            try {
                const data = await sendSignupOtp({ name, phone, email });
                stopLoadingAnimation(sendOtpBtn, "Resend OTP"); // ⭐ Stop loading, set text to Resend
                sendOtpBtn.dataset.originalText = "Resend OTP"; // Update stored original text
                messageDiv.textContent = data.message;
                messageDiv.style.color = 'green';

                signupVerificationStage.style.display = 'block';
                createAccountBtn.disabled = false;
                signupNameInput.disabled = true;
                signupPhoneInput.disabled = true;
                signupEmailInput.disabled = true;

            } catch (error) {
                stopLoadingAnimation(sendOtpBtn); // ⭐ Stop loading, restore original text
                messageDiv.textContent = `Error: ${error.message}`;
                messageDiv.style.color = 'red';
            }
        });
    }

    // Handle the final account creation
    if (signupForm && createAccountBtn) {
        createAccountBtn.dataset.originalText = createAccountBtn.textContent; // Store initial text
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
             // Allow submit only if not already loading
            if (createAccountBtn.disabled && loadingInterval) return;
             if (createAccountBtn.disabled) return; // Prevent submit if button is disabled for other reasons

            const name = signupNameInput.value;
            const phone = signupPhoneInput.value;
            const email = signupEmailInput.value;
            const otp = document.getElementById('signup-otp').value;
            const password = document.getElementById('signup-password').value;

            if (password.length < 6) {
                messageDiv.textContent = 'Password must be at least 6 characters long.';
                messageDiv.style.color = 'red';
                return;
            }

            messageDiv.textContent = '';
            startLoadingAnimation(createAccountBtn, "Creating"); // ⭐ Start loading

            try {
                const data = await createAccount({ name, phone, email, password, otp });
                // Don't stop animation here, let redirect handle button state implicitly
                // stopLoadingAnimation(createAccountBtn);
                messageDiv.textContent = data.message + ' Please sign in.';
                messageDiv.style.color = 'green';

                signupForm.reset();
                signupVerificationStage.style.display = 'none';
                signupNameInput.disabled = false;
                signupPhoneInput.disabled = false;
                signupEmailInput.disabled = false;
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = 'Send OTP'; // Reset OTP button text
                sendOtpBtn.dataset.originalText = 'Send OTP'; // Reset original text
                createAccountBtn.disabled = true;
                showSignInView();

            } catch (error) {
                stopLoadingAnimation(createAccountBtn); // ⭐ Stop loading
                messageDiv.textContent = `Error: ${error.message}`;
                messageDiv.style.color = 'red';
            }
        });
    }

    // --- 2. HANDLE SIGN IN ---
    if (signinForm) {
        const signinButton = signinForm.querySelector('button[type="submit"]');
        signinButton.dataset.originalText = signinButton.textContent; // Store initial text
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Allow submit only if not already loading
            if (signinButton.disabled && loadingInterval) return;

            const identifier = document.getElementById('signin-identifier').value;
            const password = document.getElementById('signin-password').value;

            messageDiv.textContent = '';
            startLoadingAnimation(signinButton, "Signing In"); // ⭐ Start loading

            try {
                // FIX: Updated to live backend URL
                const response = await fetch(`${API_URL}/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                localStorage.setItem('userAuthToken', data.token);
                localStorage.setItem('userName', data.name);

                const userData = await fetchUserData();

                localStorage.setItem('wishlistProducts', JSON.stringify(userData.wishlist || []));
                localStorage.setItem('cartProducts', JSON.stringify(userData.cart || []));
                localStorage.setItem('userOrders', JSON.stringify(userData.orders || []));
                localStorage.setItem('viewedProducts', JSON.stringify(userData.viewedItems || []));
                localStorage.setItem('deliveryAddress', JSON.stringify(userData.address || {}));

                // Stop loading animation before redirecting
                stopLoadingAnimation(signinButton);
                messageDiv.textContent = data.message + ' Redirecting...';
                messageDiv.style.color = 'blue';
                setTimeout(() => { window.location.href = './index.html'; }, 1000);

            } catch (error) {
                stopLoadingAnimation(signinButton); // ⭐ Stop loading on error
                messageDiv.style.color = 'red';
                const errorMessage = error.message;

                if (errorMessage.includes('User not found')) {
                    messageDiv.textContent = 'Error: No account found.';
                } else if (errorMessage.includes('Incorrect password')) {
                    messageDiv.innerHTML = `Error: Incorrect password. <a href="#" id="forgot-password-link" class="font-bold hover:text-white transition">Forgot Password?</a>`;
                    document.getElementById('forgot-password-link')?.addEventListener('click', (event) => {
                        // (Existing forgot password link logic)
                        event.preventDefault();
                        signinForm.style.display = 'none';
                        signupForm.style.display = 'none';
                        forgotPasswordForm.style.display = 'block';
                        emailStage.style.display = 'block';
                        otpVerificationStage.style.display = 'none';
                        newPasswordStage.style.display = 'none';
                        emailStage.querySelectorAll('input, button').forEach(el => el.disabled = false);
                        otpVerificationStage.querySelectorAll('input, button').forEach(el => el.disabled = true);
                        newPasswordStage.querySelectorAll('input, button').forEach(el => el.disabled = true);
                        toggleContainer.style.display = 'block';
                        formTitle.textContent = 'Reset Password';
                        formDescription.textContent = 'Enter your email for a code.';
                        signinToggleText.textContent = 'Remembered password?';
                        toggleLink.textContent = 'Sign In';
                        messageDiv.textContent = '';
                        isSignIn = true;
                    });
                } else {
                    messageDiv.textContent = `Error: ${errorMessage}`;
                }
            }
        });
    }

    // --- 3. HANDLE FORGOT PASSWORD ---
    if (forgotPasswordForm) {
        // Store original text for each button in the forgot password form
        const sendCodeButton = emailStage?.querySelector('button[type="submit"]');
        const verifyCodeButton = otpVerificationStage?.querySelector('button[type="submit"]');
        const resetPasswordButton = newPasswordStage?.querySelector('button[type="submit"]');

        if(sendCodeButton) sendCodeButton.dataset.originalText = sendCodeButton.textContent;
        if(verifyCodeButton) verifyCodeButton.dataset.originalText = verifyCodeButton.textContent;
        if(resetPasswordButton) resetPasswordButton.dataset.originalText = resetPasswordButton.textContent;


        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = '';
            messageDiv.style.color = 'blue';

            // Find the currently active button
            let currentButton;
            let loadingText = "Processing";

            if (emailStage.style.display !== 'none') {
                 currentButton = sendCodeButton;
                 loadingText = "Sending";
            } else if (otpVerificationStage.style.display !== 'none') {
                 currentButton = verifyCodeButton;
                 loadingText = "Verifying";
            } else if (newPasswordStage.style.display !== 'none'){
                 currentButton = resetPasswordButton;
                 loadingText = "Resetting";
            }

            if (!currentButton || (currentButton.disabled && loadingInterval)) return; // Prevent if no button or loading

            startLoadingAnimation(currentButton, loadingText); // ⭐ Start loading

            // --- Stage 1: Send Email for OTP ---
            if (emailStage.style.display !== 'none') {
                const email = document.getElementById('forgot-email').value;
                try {
                    const data = await requestPasswordReset(email);
                    stopLoadingAnimation(currentButton); // ⭐ Stop loading
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'green';

                    emailStage.style.display = 'none';
                    otpVerificationStage.style.display = 'block';
                    newPasswordStage.style.display = 'none';
                    emailStage.querySelectorAll('input, button').forEach(el => el.disabled = true);
                    otpVerificationStage.querySelectorAll('input, button').forEach(el => el.disabled = false);
                    newPasswordStage.querySelectorAll('input, button').forEach(el => el.disabled = true);
                    formDescription.textContent = 'Enter the 6-digit code sent.';
                } catch (error) {
                    stopLoadingAnimation(currentButton); // ⭐ Stop loading
                    messageDiv.textContent = `Error: ${error.message}`;
                    messageDiv.style.color = 'red';
                }

            // --- Stage 2: Verify OTP ---
            } else if (otpVerificationStage.style.display !== 'none') {
                const email = document.getElementById('forgot-email').value;
                const otp = document.getElementById('forgot-otp').value;
                try {
                    await verifyOtp(email, otp);
                    stopLoadingAnimation(currentButton); // ⭐ Stop loading
                    messageDiv.textContent = 'Code verified. Set new password.';
                    messageDiv.style.color = 'green';

                    otpVerificationStage.style.display = 'none';
                    newPasswordStage.style.display = 'block';
                    otpVerificationStage.querySelectorAll('input, button').forEach(el => el.disabled = true);
                    newPasswordStage.querySelectorAll('input, button').forEach(el => el.disabled = false);
                    formDescription.textContent = 'Create a new password.';
                } catch (error) {
                    stopLoadingAnimation(currentButton); // ⭐ Stop loading
                    messageDiv.textContent = `Error: ${error.message}`;
                    messageDiv.style.color = 'red';
                }

            // --- Stage 3: Reset Password ---
            } else if (newPasswordStage.style.display !== 'none'){
                const email = document.getElementById('forgot-email').value;
                const otp = document.getElementById('forgot-otp').value;
                const newPassword = document.getElementById('forgot-new-password').value;
                const confirmPassword = document.getElementById('forgot-confirm-password').value;

                if (newPassword !== confirmPassword) {
                    stopLoadingAnimation(currentButton); // Stop loading before showing error
                    messageDiv.textContent = "Passwords do not match.";
                    messageDiv.style.color = 'red';
                    return;
                }
                if (newPassword.length < 6) {
                    stopLoadingAnimation(currentButton); // Stop loading before showing error
                    messageDiv.textContent = 'Password min 6 characters.';
                    messageDiv.style.color = 'red';
                    return;
                }

                try {
                    const data = await verifyOtpAndReset({ email, otp, newPassword });
                    // Don't stop animation, let redirect handle state
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'green';
                    forgotPasswordForm.reset();
                    setTimeout(() => {
                        showSignInView();
                        messageDiv.textContent = 'Password reset. Please sign in.';
                        messageDiv.style.color = 'green';
                    }, 2000);
                } catch (error) {
                    stopLoadingAnimation(currentButton); // ⭐ Stop loading
                    messageDiv.textContent = `Error: ${error.message}`;
                    messageDiv.style.color = 'red';
                }
            } else {
                 // Should not happen, but stop animation just in case
                 if(currentButton) stopLoadingAnimation(currentButton);
            }
        });
    }

    // --- Prevent 'Enter' key submit ---
    document.querySelectorAll('form input').forEach(input => {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const form = this.closest('form');
                if (form) {
                    const submitButton = form.querySelector('button[type="submit"]:not([disabled])');
                    if (submitButton && !loadingInterval) { // Only click if not loading
                        submitButton.click();
                    }
                }
            }
        });
    });
});