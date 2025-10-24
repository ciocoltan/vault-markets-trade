// --- URL Parameter & Cookie Tracking ---
(function () {
  var url_string = window.location.href;
  var url = new URL(url_string);
  var cookieValues = {};
  const entries = url.searchParams.entries();

  for (const entry of entries) {
    const param = {
      name: entry[0],
      value: entry[1],
    };

    if (param.name.startsWith("utm_")) {
      cookieValues[param.name] = param.value;
    }

    const extraParams = ["gclid", "fbclid", "msclkid"];
    for (let e = 0; e < extraParams.length; e++) {
      const extraParam = extraParams[e];
      if (param.name === extraParam) {
        cookieValues[param.name] = param.value;
      }
    }
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    const domain = window.location.hostname;
    const domainAttribute = domain === "localhost" ? "" : `; domain=${domain}`;
    document.cookie =
      name +
      "=" +
      (JSON.stringify(value) || "") +
      expires +
      "; path=/" +
      domainAttribute;
  }

  if (Object.keys(cookieValues).length > 0) {
    const expireDays = 30;
    setCookie("UrlOriginalQueryParameters", cookieValues, expireDays);
  }
})();

import '../css/main.css';
import { register, getCountryFromTrace, socialLogin, buildTrackingPayload, saveProgressAndRedirect, loadHtmlPartial, } from "./api.js";

// --- Registration Form Logic ---
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadHtmlPartial("header-placeholder", "/header.html"),
    loadHtmlPartial("footer-placeholder", "/footer.html"),
  ]);
  
  const spinnerOverlay = document.getElementById("spinner-overlay");
  const registerForm = document.getElementById("register-form");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  const privacyCheckbox = document.getElementById("privacy-policy");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const privacyError = document.getElementById("privacy-error");
  const generalError = document.getElementById("general-error");
  const passwordRequirements = document.getElementById("password-requirements");
  const reqLength = document.getElementById("req-length");
  const reqUppercase = document.getElementById("req-uppercase");
  const reqSpecial = document.getElementById("req-special");
  const reqNumber = document.getElementById("req-number");
  const googleSignUpBtn = document.getElementById("google-signup-btn");
  const appleSignUpBtn = document.getElementById("apple-signup-btn");

  if (!registerForm) {
    console.error(
      "Registration form not found. Make sure the element with ID 'register-form' exists."
    );
    return;
  }

  passwordInput.addEventListener("focus", () => {
    passwordRequirements.classList.remove("hidden");
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      const recaptchaToken = await new Promise((resolve) => {
        grecaptcha.enterprise.ready(async () => {
          const generatedToken = await grecaptcha.enterprise.execute(
            "6LcFJusrAAAAAI4XeQgnTdAQ1sWQJmspwX-OhGIP",
            { action: "REGISTER" }
          );
          resolve(generatedToken);
        });
      });
      const countryCode = await getCountryFromTrace();
      let finalPayload = {
        email: emailInput.value,
        password: passwordInput.value,
        country: countryCode,
        recaptchaToken: recaptchaToken,
      };

      const trackingData = await buildTrackingPayload();
      finalPayload = { ...finalPayload, ...trackingData };

      const data = await register(finalPayload);

      if (data && data.success === true) {
        saveProgressAndRedirect(data);
      } else {
        toggleSpinner(false);
        showError(null, generalError, data.message || "Registration failed.");
      }

    } catch (error) {
      console.error("Registration process failed:", error);
      showError(
        null,
        generalError,
        "Could not connect to the server. Please try again."
      );
      toggleSpinner(false);
    }
  });

  emailInput.addEventListener("input", () =>
    clearError(emailInput, emailError)
  );
  passwordInput.addEventListener("input", () => {
    clearError(passwordInput, passwordError);
    validatePassword(passwordInput.value);
  });
  privacyCheckbox.addEventListener("change", () =>
    clearError(privacyCheckbox, privacyError)
  );

  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
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
      const passInput = toggle.closest(".relative").querySelector("input");
      if (passInput.type === "password") {
        passInput.type = "text";
        toggle.textContent = "🙈";
      } else {
        passInput.type = "password";
        toggle.innerHTML = eyeIconSvg;
      }
    });
  });

  const toggleSpinner = (show) =>
    spinnerOverlay.classList.toggle("hidden", !show);

  function validateForm() {
    let isValid = true;
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);
    clearError(privacyCheckbox, privacyError);

    if (!emailInput.value.trim() || !/^\S+@\S+\.\S+$/.test(emailInput.value)) {
      showError(emailInput, emailError, "Please enter a valid email address.");
      isValid = false;
    }
    if (!validatePassword(passwordInput.value)) {
      showError(
        passwordInput,
        passwordError,
        "Password does not meet all requirements."
      );
      isValid = false;
    }
    if (!privacyCheckbox.checked) {
      showError(
        privacyCheckbox,
        privacyError,
        "Agreeing to the Privacy Policy is required."
      );
      isValid = false;
    }
    return isValid;
  }

  function validatePassword(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const hasCorrectLength = password.length >= 8 && password.length <= 35;

    reqLength.style.color = hasCorrectLength ? "green" : "inherit";
    reqUppercase.style.color = hasUppercase ? "green" : "inherit";
    reqNumber.style.color = hasNumber ? "green" : "inherit";
    reqSpecial.style.color = hasSpecial ? "green" : "inherit";

    return hasUppercase && hasNumber && hasSpecial && hasCorrectLength;
  }

  function showError(input, errorElement, message) {
    if (input) input.classList.add("error");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }

  function clearError(input, errorElement) {
    if (input) input.classList.remove("error");
    errorElement.classList.add("hidden");
  }

  // --- SOCIAL SIGN UP HANDLERS ---
    if (googleSignUpBtn) {
        const client_id = "626162008019-rpsgku39p9p1mdh9s1ad3ls9ejq7h3b1.apps.googleusercontent.com";
        const redirect_uri = window.location.origin + '/login/'; 
        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.append("client_id", client_id);
        googleAuthUrl.searchParams.append("redirect_uri", redirect_uri);
        googleAuthUrl.searchParams.append("response_type", "code");
        googleAuthUrl.searchParams.append("scope", "openid email profile");
        googleAuthUrl.searchParams.append("prompt", "select_account"); 
        googleAuthUrl.searchParams.append("state", "register");       
        googleSignUpBtn.href = googleAuthUrl.toString();
    }

  // --- Apple Sign Up ---
  if (appleSignUpBtn) {
    appleSignUpBtn.addEventListener("click", async () => {
      try {
        if (typeof AppleID === "undefined") {
          showError(null, generalError, "Apple Sign-In script not loaded.");
          return;
        }
        const data = await AppleID.auth.signIn();
        handleSocialLogin("apple", data.authorization.id_token);
      } catch (error) {
        console.error("Apple Sign-In failed:", error);
        showError(null, generalError, "Apple Sign-In was cancelled or failed.");
      }
    });
  }

  async function handleSocialLogin(provider, token) {
    toggleSpinner(true);
    try {
      const countryCode = await getCountryFromTrace();
      let finalPayload = {
        provider: provider,
        token: token,
        country: countryCode,
      };
      const trackingData = await buildTrackingPayload();
      finalPayload = { ...finalPayload, ...trackingData };

      const data = await socialLogin(finalPayload);

      if (data && data.success === true) {
        saveProgressAndRedirect(data);
      } else {
        showError(
          null,
          generalError,
          data.message || `${provider} registration failed.`
        );
        toggleSpinner(false);
      }
    } catch (error) {
      showError(
        null,
        generalError,
        "Could not connect to the server. Please try again."
      );
      toggleSpinner(false);
    }
  }

});