// Shows "You have been successfully logged out" banner when the page
// is opened via Index.html?logout=success (see the Logout link in the navbar)

document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const banner = document.getElementById("logout-banner");
  const closeBtn = document.getElementById("close-banner");

  if (params.get("logout") === "success") {
    banner.hidden = false;

    // clean the URL so refreshing the page doesn't show the banner again
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  closeBtn.addEventListener("click", function () {
    banner.hidden = true;
  });
});
