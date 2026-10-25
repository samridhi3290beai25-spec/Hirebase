// Shared light/dark theme toggle & user auth state management.
// Used on every page to sync theme, logged-in vs guest navbar states, and mobile menu toggle.

document.addEventListener("DOMContentLoaded", function () {
  // ---------- Theme Toggle ----------
  const btn = document.getElementById("theme-toggle");
  
  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function syncThemeButton() {
    if (!btn) return;
    btn.textContent = isDark() ? "☀" : "☾";
    btn.setAttribute(
      "aria-label",
      isDark() ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  if (btn) {
    btn.addEventListener("click", function () {
      const next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("hb_theme", next);
      } catch (e) {}
      syncThemeButton();
    });
    syncThemeButton();
  }

  // ---------- Mobile Hamburger Menu Toggle ----------
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.querySelector(".navbar");

  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const isOpen = navbar.classList.toggle("nav-open");
      menuToggle.textContent = isOpen ? "✕" : "☰";
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!navbar.contains(e.target) && navbar.classList.contains("nav-open")) {
        navbar.classList.remove("nav-open");
        menuToggle.textContent = "☰";
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    // Close mobile menu when clicking any nav link
    const navLinks = navbar.querySelectorAll(".nav-links a");
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        navbar.classList.remove("nav-open");
        menuToggle.textContent = "☰";
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------- User Auth State Sync ----------
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "success") {
      if (window.HirebaseStore) {
        window.HirebaseStore.logoutUser();
      } else {
        localStorage.removeItem("hb_logged_in");
      }
    }

    if (window.HirebaseStore) {
      window.HirebaseStore.syncNavAuth();
    } else {
      const isLoggedIn = localStorage.getItem("hb_logged_in") === "true";
      document.documentElement.setAttribute("data-user-logged-in", isLoggedIn ? "true" : "false");
    }
  } catch (e) {}
});
