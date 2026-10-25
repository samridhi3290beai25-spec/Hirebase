// ============================================================
// Hirebase Sign Up Controller (js/signup.js)
// Handles candidate & recruiter registration, client-side validation,
// duplicate account prevention, and OAuth demo onboarding.
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
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

  const accountTypeSelect = document.getElementById("account-type");
  const companyField = document.getElementById("company-field");
  const websiteField = document.getElementById("website-field");
  const companyInput = document.getElementById("company-name");
  const submitBtn = document.getElementById("signup-submit-btn");
  const nameLabel = document.getElementById("name-label");
  const emailLabel = document.getElementById("email-label");

  // Toggle account type fields
  if (accountTypeSelect) {
    accountTypeSelect.addEventListener("change", function () {
      const isProvider = this.value === "provider";
      if (companyField) companyField.style.display = isProvider ? "flex" : "none";
      if (websiteField) websiteField.style.display = isProvider ? "flex" : "none";
      if (nameLabel) nameLabel.textContent = isProvider ? "Recruiter / Contact Name" : "Full name";
      if (emailLabel) emailLabel.textContent = isProvider ? "Work Email Address" : "Email address";
      if (submitBtn) submitBtn.textContent = isProvider ? "Create Employer Account" : "Create Candidate Account";
    });
  }

  // Real-time input cleaning
  ["full-name", "company-name", "company-website", "signup-email", "signup-password", "confirm-password"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => clearFieldError(id));
      el.addEventListener("change", () => clearFieldError(id));
    }
  });

  const form = document.getElementById("signup-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      let isValid = true;
      const nameInput = document.getElementById("full-name");
      const emailInput = document.getElementById("signup-email");
      const passwordInput = document.getElementById("signup-password");
      const confirmInput = document.getElementById("confirm-password");
      const message = document.getElementById("signup-message");

      const role = accountTypeSelect ? accountTypeSelect.value : "seeker";
      const nameVal = nameInput ? nameInput.value.trim() : "";
      const emailVal = emailInput ? emailInput.value.trim() : "";
      const passVal = passwordInput ? passwordInput.value : "";
      const confirmVal = confirmInput ? confirmInput.value : "";
      const companyVal = companyInput ? companyInput.value.trim() : "";
      const websiteVal = document.getElementById("company-website")?.value.trim() || "";

      // Validate Name
      if (!nameVal) {
        setFieldError("full-name", "Full name is required.");
        isValid = false;
      } else if (nameVal.length < 2) {
        setFieldError("full-name", "Full name must be at least 2 characters.");
        isValid = false;
      } else {
        clearFieldError("full-name");
      }

      // Validate Company if Recruiter
      if (role === "provider") {
        if (!companyVal) {
          setFieldError("company-name", "Company name is required for recruiter accounts.");
          isValid = false;
        } else {
          clearFieldError("company-name");
        }
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal) {
        setFieldError("signup-email", "Email address is required.");
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        setFieldError("signup-email", "Please enter a valid email address (e.g. name@domain.com).");
        isValid = false;
      } else {
        clearFieldError("signup-email");
      }

      // Validate Password
      if (!passVal) {
        setFieldError("signup-password", "Password is required.");
        isValid = false;
      } else if (passVal.length < 8) {
        setFieldError("signup-password", "Password must be at least 8 characters.");
        isValid = false;
      } else {
        clearFieldError("signup-password");
      }

      // Validate Confirm Password
      if (!confirmVal) {
        setFieldError("confirm-password", "Please confirm your password.");
        isValid = false;
      } else if (passVal !== confirmVal) {
        setFieldError("confirm-password", "Passwords do not match.");
        isValid = false;
      } else {
        clearFieldError("confirm-password");
      }

      if (!isValid) {
        if (message) {
          message.textContent = "Please fill in all required fields highlighted above.";
          message.className = "form-message error";
        }
        return;
      }

      // Prevent duplicate submissions
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Registering Account...";
      }

      // Check duplicate and register with HirebaseStore
      const result = window.HirebaseStore.registerUser({
        name: nameVal,
        email: emailVal,
        password: passVal,
        role: role,
        company: companyVal,
        website: websiteVal
      });

      if (!result.success) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = role === "provider" ? "Create Employer Account" : "Create Candidate Account";
        }
        if (message) {
          message.textContent = "⚠️ " + result.error;
          message.className = "form-message error";
        }
        setFieldError("signup-email", result.error);
        return;
      }

      if (message) {
        message.textContent = "✓ Account registered successfully! Launching your portal...";
        message.className = "form-message success";
      }

      setTimeout(function () {
        window.location.href = "loading.html?type=signup";
      }, 600);
    });
  }

  // ---------- Honest Social Auth Handling ----------
  const socialBtns = document.querySelectorAll(".btn-social");
  const oauthNotice = document.getElementById("oauth-notice-box");
  const btnDemoSeeker = document.getElementById("btn-oauth-demo-seeker");
  const btnDemoProvider = document.getElementById("btn-oauth-demo-provider");
  const btnCloseNotice = document.getElementById("btn-oauth-close");

  socialBtns.forEach(btn => {
    // Only target the top 3 social buttons, not the notice action buttons
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
