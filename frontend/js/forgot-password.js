import '../css/main.css';
import { requestPasswordReset, loadHtmlPartial } from "./api.js";

document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([
    loadHtmlPartial("header-placeholder", "/header.html"),
    loadHtmlPartial("footer-placeholder", "/footer.html"),
  ]);

    const formContainer = document.querySelector('.form-container');
    const successMessage = document.getElementById('success-message');
    const forgotForm = document.getElementById('forgot-form-actual');
    const emailInput = document.getElementById('forgot-email');
    const emailError = document.getElementById("forgot-email-error");
    const generalError = document.getElementById('forgot-general-error');
    const spinnerOverlay = document.getElementById('spinner-overlay');

    function toggleSpinner(show) {
        if (spinnerOverlay) spinnerOverlay.classList.toggle('hidden', !show);
    }
    
    function showError(input, errorElement, message) {
        if (input) input.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    function clearError(input, errorElement) {
        if (input) input.classList.remove('error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    function validateForm() {
        clearError(emailInput, emailError);
        if (!emailInput.value.trim() || !/^\S+@\S+\.\S+$/.test(emailInput.value)) {
            showError(emailInput, emailError, 'Please enter a valid email address.');
            return false;
        }
        return true;
    }
    
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            toggleSpinner(true);
            clearError(null, generalError);
            
            if (typeof grecaptcha === 'undefined' || typeof grecaptcha.enterprise === 'undefined') {
                showError(null, generalError, "Security check failed. Please disable ad-blockers and try again.");
                toggleSpinner(false);
                return;
            }

            try {
                 const recaptchaToken = await new Promise((resolve) => {
                    grecaptcha.enterprise.ready(async () => {
                        const generatedToken = await grecaptcha.enterprise.execute('6LcFJusrAAAAAI4XeQgnTdAQ1sWQJmspwX-OhGIP', {action: 'FORGOT_PASSWORD'});
                        resolve(generatedToken);
                    });
                });

                const result = await requestPasswordReset(emailInput.value, recaptchaToken);
                toggleSpinner(false); 
                
                console.log('Forgot password request sent.');
                formContainer.classList.add('hidden');
                successMessage.classList.remove('hidden');

            } catch (error) {
                toggleSpinner(false);
                showError(null, generalError, "Could not connect to the server. Please try again.");
            }
        }
    });

    emailInput.addEventListener('input', () => clearError(emailInput, emailError));
});