// ============================================================
// Hirebase Sign In Controller (js/signin.js)
// Handles credential authentication, captcha validation, role
// dispatching via HirebaseStore, and OAuth demo flows.
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  const captchaCodeEl = document.getElementById("captcha-code");
  let currentCaptcha = "";

  function generateCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    currentCaptcha = code;
    if (captchaCodeEl) captchaCodeEl.textContent = code;
  }

  if (captchaCodeEl) {
    generateCaptcha();
    const refreshBtn = document.getElementById("captcha-refresh");
    if (refreshBtn) refreshBtn.addEventListener("click", generateCaptcha);
  }

  // Helper: Show field inline error
  function setFieldError(fieldId, errorText) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.classList.add("invalid");
    let errEl = input.parentNode.querySelector(".field-error-msg");
    if (!errEl) {
      errEl = document.createElement("div");
      errEl.className = "field-error-msg";
      input.parentNode.appendChild(errEl);
    }
    errEl.textContent = "⚠️ " + errorText;
  }

  // Helper: Clear field error
  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.classList.remove("invalid");
    const errEl = input.parentNode.querySelector(".field-error-msg");
    if (errEl) errEl.remove();
  }

  // Real-time input cleaning
  ["signin-email", "signin-password", "captcha-input"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => clearFieldError(id));
      el.addEventListener("change", () => clearFieldError(id));
    }
  });

  const signinForm = document.getElementById("signin-form");
  if (signinForm) {
    signinForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let isValid = true;
      const emailInput = document.getElementById("signin-email");
      const passwordInput = document.getElementById("signin-password");
      const captchaInput = document.getElementById("captcha-input");
      const message = document.getElementById("signin-message");
      const submitBtn = signinForm.querySelector("button[type='submit']");

      // Validate Email
      const emailVal = emailInput ? emailInput.value.trim() : "";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal) {
        setFieldError("signin-email", "Email address is required.");
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        setFieldError("signin-email", "Please enter a valid email address (e.g. name@domain.com).");
        isValid = false;
      } else {
        clearFieldError("signin-email");
      }

      // Validate Password
      const passVal = passwordInput ? passwordInput.value : "";
      if (!passVal) {
        setFieldError("signin-password", "Password is required.");
        isValid = false;
      } else if (passVal.length < 6) {
        setFieldError("signin-password", "Password must be at least 6 characters.");
        isValid = false;
      } else {
        clearFieldError("signin-password");
      }

      // Validate Captcha
      const capVal = captchaInput ? captchaInput.value.trim().toUpperCase() : "";
      if (!capVal) {
        setFieldError("captcha-input", "Security code is required.");
        isValid = false;
      } else if (capVal !== currentCaptcha) {
        setFieldError("captcha-input", "Security code did not match. A new code was generated.");
        generateCaptcha();
        if (captchaInput) captchaInput.value = "";
        isValid = false;
      } else {
        clearFieldError("captcha-input");
      }

      if (!isValid) {
        if (message) {
          message.textContent = "Please correct the required fields highlighted above.";
          message.className = "form-message error";
        }
        return;
      }

      // Prevent duplicate submissions
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying Credentials...";
      }

      // Verify with HirebaseStore
      const loginResult = window.HirebaseStore.loginUser(emailVal, passVal);

      if (!loginResult.success) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign in to Hirebase";
        }
        generateCaptcha();
        if (captchaInput) captchaInput.value = "";

        if (message) {
          message.textContent = "⚠️ " + loginResult.error;
          message.className = "form-message error";
        }
        setFieldError("signin-password", "Invalid credentials.");
        return;
      }

      if (message) {
        const user = loginResult.user;
        const roleText = user.role === "provider" ? "Employer Portal" : "Job Search Portal";
        message.textContent = `✓ Credentials verified. Welcome back, ${user.name}! Launching ${roleText}...`;
        message.className = "form-message success";
      }

      setTimeout(function () {
        window.location.href = "loading.html?type=signin";
      }, 600);
    });
  }

  // ---------- Forgot password toggle & validation ----------
  const forgotToggle = document.getElementById("forgot-toggle");
  const forgotForm = document.getElementById("forgot-form");

  if (forgotToggle && forgotForm) {
    forgotToggle.addEventListener("click", function () {
      const isHidden = forgotForm.hidden;
      forgotForm.hidden = !isHidden;
      forgotToggle.textContent = isHidden ? "Back to sign in" : "Forgot password?";
    });

    const forgotEmail = document.getElementById("forgot-email");
    if (forgotEmail) {
      forgotEmail.addEventListener("input", () => clearFieldError("forgot-email"));
    }

    forgotForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const forgotVal = forgotEmail ? forgotEmail.value.trim() : "";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const forgotMessage = document.getElementById("forgot-message");

      if (!forgotVal) {
        setFieldError("forgot-email", "Email is required to reset password.");
        return;
      } else if (!emailRegex.test(forgotVal)) {
        setFieldError("forgot-email", "Please enter a valid email address.");
        return;
      }

      clearFieldError("forgot-email");
      const user = window.HirebaseStore.getUserByEmail(forgotVal);
      if (user) {
        if (forgotMessage) {
          forgotMessage.textContent = `✓ Password reset link generated for ${user.email}. (Demo password is: ${user.password})`;
          forgotMessage.className = "form-message success";
        }
      } else {
        if (forgotMessage) {
          forgotMessage.textContent = "If an account with that email exists, password reset instructions have been dispatched.";
          forgotMessage.className = "form-message success";
        }
      }
    });
  }

  // ---------- Honest Social Auth Handling ----------
  const socialBtns = document.querySelectorAll(".btn-social");
  const oauthNotice = document.getElementById("oauth-notice-box");
  const btnDemoSeeker = document.getElementById("btn-oauth-demo-seeker");
  const btnDemoProvider = document.getElementById("btn-oauth-demo-provider");
  const btnCloseNotice = document.getElementById("btn-oauth-close");

  socialBtns.forEach(btn => {
    if (btn.id !== "btn-oauth-demo-seeker" && btn.id !== "btn-oauth-demo-provider" && btn.id !== "btn-oauth-close") {
      btn.addEventListener("click", function () {
        if (oauthNotice) {
          oauthNotice.style.display = "block";
          oauthNotice.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
  });

  if (btnDemoSeeker) {
    btnDemoSeeker.addEventListener("click", function () {
      const seeker = window.HirebaseStore.getUserByEmail("jordan@hirebase.com") || window.HirebaseStore.getUsers()[0];
      window.HirebaseStore.setCurrentUser(seeker);
      window.location.href = "loading.html?type=signin";
    });
  }

  if (btnDemoProvider) {
    btnDemoProvider.addEventListener("click", function () {
      const provider = window.HirebaseStore.getUserByEmail("sarah@cursive.com") || window.HirebaseStore.getUsers().find(u => u.role === "provider");
      window.HirebaseStore.setCurrentUser(provider);
      window.location.href = "loading.html?type=signin";
    });
  }

  if (btnCloseNotice && oauthNotice) {
    btnCloseNotice.addEventListener("click", function () {
      oauthNotice.style.display = "none";
    });
  }
});
