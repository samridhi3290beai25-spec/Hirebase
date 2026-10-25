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

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  input.classList.remove("invalid");
  const errEl = input.parentNode.querySelector(".field-error-msg");
  if (errEl) errEl.remove();
}

["contact-name", "contact-email", "contact-message"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => clearFieldError(id));
});

document.getElementById("contact-form").addEventListener("submit", function (e) {
  e.preventDefault();

  let isValid = true;
  const nameVal = document.getElementById("contact-name").value.trim();
  const emailVal = document.getElementById("contact-email").value.trim();
  const msgVal = document.getElementById("contact-message").value.trim();
  const status = document.getElementById("contact-status");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nameVal) { setFieldError("contact-name", "Your name is required."); isValid = false; }
  if (!emailVal || !emailRegex.test(emailVal)) { setFieldError("contact-email", "Valid email address is required."); isValid = false; }
  if (!msgVal || msgVal.length < 10) { setFieldError("contact-message", "Please enter a message (min 10 chars)."); isValid = false; }

  if (!isValid) {
    if (status) {
      status.textContent = "Please fill in all required fields highlighted in red above.";
      status.className = "form-message error";
    }
    return;
  }

  if (status) {
    status.textContent = "✓ Message sent successfully! Our team will get back to you within 24 hours.";
    status.className = "form-message success";
  }

  this.reset();
});
