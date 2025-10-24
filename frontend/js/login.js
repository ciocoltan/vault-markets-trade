import "../css/main.css";
import {
  login,
  socialLogin,
  getCountryFromTrace,
  buildTrackingPayload,
  saveProgressAndRedirect,
  loadHtmlPartial,
} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadHtmlPartial("header-placeholder", "/header.html"),
    loadHtmlPartial("footer-placeholder", "/footer.html"),
  ]);

  const loginForm = document.getElementById("login-form-actual");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const emailError = document.getElementById("login-email-error");
  const passwordError = document.getElementById("login-password-error");
  const generalError = document.getElementById("login-general-error");
  const spinnerOverlay = document.getElementById("spinner-overlay");
  const googleSignInBtn = document.getElementById("google-signin-link");

  function showError(input, errorElement, message) {
    if (input) input.classList.add("error");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }

  function clearError(input, errorElement) {
    if (input) input.classList.remove("error");
    errorElement.classList.add("hidden");
  }

  function toggleSpinner(show) {
    spinnerOverlay.classList.toggle("hidden", !show);
  }

  function validateForm() {
    let isValid = true;
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);

    if (!emailInput.value.trim() || !/^\S+@\S+\.\S+$/.test(emailInput.value)) {
      showError(emailInput, emailError, "Please enter a valid email address.");
      isValid = false;
    }
    if (!passwordInput.value.trim()) {
      showError(passwordInput, passwordError, "Password is required.");
      isValid = false;
    }
    return isValid;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    generalError.classList.add("hidden");

    if (!validateForm()) {
      return;
    }

    toggleSpinner(true);

    if (
      typeof grecaptcha === "undefined" ||
      typeof grecaptcha.enterprise === "undefined"
    ) {
      showError(
        null,
        generalError,
        "Security check failed. Please disable ad-blockers and try again."
      );
      toggleSpinner(false);
      return;
    }

    try {
      const token = await new Promise((resolve) => {
        grecaptcha.enterprise.ready(async () => {
          const generatedToken = await grecaptcha.enterprise.execute(
            "6LcFJusrAAAAAI4XeQgnTdAQ1sWQJmspwX-OhGIP",
            { action: "LOGIN" }
          );
          resolve(generatedToken);
        });
      });

      const email = emailInput.value;
      const password = passwordInput.value;
      const data = await login(email, password, token);

      if (data && data.success === true) {
        saveProgressAndRedirect(data);
      } else {
        showError(null, generalError, data.message || "Invalid credentials.");
        toggleSpinner(false);
      }
    } catch (error) {
      console.error("Login request failed:", error);
      showError(
        null,
        generalError,
        "Could not connect to the server. Please try again."
      );
      toggleSpinner(false);
    }
  });

  // --- SOCIAL SIGN-IN HANDLERS ---

  async function handleOauthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    if (!code) return false;
    window.history.replaceState({}, document.title, window.location.pathname);
    toggleSpinner(true);

    try {
      await handleSocialLogin("google", code, state);
    } catch (error) {
      toggleSpinner(false);
      showError(null, generalError, "Failed to complete Google Sign-In.");
    }
    return true;
  }

  const wasCallbackHandled = await handleOauthCallback();
  if (wasCallbackHandled) return;

  if (googleSignInBtn) {
    const client_id =
      "626162008019-rpsgku39p9p1mdh9s1ad3ls9ejq7h3b1.apps.googleusercontent.com";
    const redirect_uri = window.location.origin + window.location.pathname;
    const googleAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    googleAuthUrl.searchParams.append("client_id", client_id);
    googleAuthUrl.searchParams.append("redirect_uri", redirect_uri);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("prompt", "select_account");
    googleSignInBtn.href = googleAuthUrl.toString();
  }

  async function handleSocialLogin(provider, token, flow) {
    try {
      let payload = { provider, token };

      if (flow === "register") {
        console.log("Registration flow detected. Adding tracking data...");
        const trackingData = await buildTrackingPayload();
        const countryCode = await getCountryFromTrace();
        payload = { ...payload, ...trackingData, country: countryCode };
      }

      const data = await socialLogin(payload);

      if (data && data.success === true) {
        saveProgressAndRedirect(data);
      } else {
        toggleSpinner(false);
        showError(
          null,
          generalError,
          data.message || `${provider} login failed.`
        );
      }
    } catch (error) {
      toggleSpinner(false);
      showError(null, generalError, "Could not connect to the server.");
    }
  }

  emailInput.addEventListener("input", () =>
    clearError(emailInput, emailError)
  );
  passwordInput.addEventListener("input", () =>
    clearError(passwordInput, passwordError)
  );

  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const passInput = toggle.closest(".relative").querySelector("input");
      const eyeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
  <g clip-path="url(#clip0_397_341)">
    <path d="M0.915998 8.51458C0.915998 8.51458 3.88705 2.91889 8.8439 3.04014C13.8008 3.16139 16.4947 8.89564 16.4947 8.89564C16.4947 8.89564 13.5236 14.4913 8.56677 14.3701C3.60992 14.2488 0.915998 8.51458 0.915998 8.51458Z" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8.65337 10.8295C9.82663 10.8582 10.801 9.93033 10.8297 8.75707C10.8584 7.58382 9.93055 6.60945 8.7573 6.58075C7.58404 6.55205 6.60967 7.47989 6.58097 8.65315C6.55227 9.8264 7.48012 10.8008 8.65337 10.8295Z" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <defs>
    <clipPath id="clip0_397_341">
      <rect width="17" height="17" fill="white" transform="translate(0.41571) rotate(1.40119)"/>
    </clipPath>
  </defs>
</svg>`;

      if (passInput.type === "password") {
        passInput.type = "text";
        toggle.textContent = "🙈";
      } else {
        passInput.type = "password";
        toggle.innerHTML = eyeIconSvg;
      }
    });
  });
});
