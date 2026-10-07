// Wait until the HTML is fully loaded before running any code
document.addEventListener("DOMContentLoaded", function () {

  // Find the call-to-action button by its ID
  const ctaButton = document.getElementById("cta-button");

  // Only attach the listener if the button exists on the page
  if (ctaButton) {
    ctaButton.addEventListener("click", function () {
      // Simple placeholder message — replace later with a real action
      alert("Thank you for your interest! More details coming soon.");
    });
  }

  // Optional: smooth scrolling for the navigation link
  const navLink = document.querySelector(".nav-link");
  if (navLink) {
    navLink.addEventListener("click", function (event) {
      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        event.preventDefault();
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

});
