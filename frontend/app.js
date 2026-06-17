/*
  app.js
  All the frontend logic lives here.

  What this file does:
  - Handles form validation (email format, URL format)
  - Calls the FastAPI backend when the user clicks submit
  - Shows a loading state while waiting for the response
  - Displays the result card on success, or an error message on failure
  - Manages the sidebar toggle on mobile
*/

// The backend URL. Change this if you run FastAPI on a different port.
const API_BASE_URL = "http://localhost:8000";

// --- Element references so we are not querying the DOM repeatedly ---
const submitBtn       = document.getElementById("submit-btn");
const emailInput      = document.getElementById("email-input");
const urlInput        = document.getElementById("url-input");
const statusArea      = document.getElementById("status-area");
const heroSection     = document.getElementById("hero-section");
const resultSection   = document.getElementById("result-section");
const loadingOverlay  = document.getElementById("loading-overlay");
const analyzeAgainBtn = document.getElementById("analyze-again-btn");

// Result fields that get populated after a successful API call
const resultSessionId = document.getElementById("result-session-id");
const resultUrl       = document.getElementById("result-url");
const resultEmail     = document.getElementById("result-email");


// === Utility Functions ===

/*
  Show a message inside the status area below the form.
  type can be "error" or "warning"
*/
function showStatus(message, type = "error") {
  statusArea.innerHTML = `
    <div class="status-message ${type}" role="alert">
      <span>${message}</span>
    </div>
  `;
}

// Remove any existing status message
function clearStatus() {
  statusArea.innerHTML = "";
}

// Show the full-screen loading overlay and disable the submit button
function showLoading() {
  loadingOverlay.hidden = false;
  loadingOverlay.removeAttribute("aria-hidden");
  submitBtn.disabled = true;
}

// Hide the loading overlay and re-enable the submit button
function hideLoading() {
  loadingOverlay.hidden = true;
  loadingOverlay.setAttribute("aria-hidden", "true");
  submitBtn.disabled = false;
}

/*
  Basic email validation using the browser's built-in pattern check.
  We do not need a complex regex for this.
*/
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/*
  Check that the string starts with http:// or https://
  so we catch obvious mistakes before hitting the backend.
*/
function isValidUrl(url) {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}


// === Form Submission ===

/*
  This is the main handler that runs when the user clicks the arrow button.
  Steps:
  1. Read and validate the input values
  2. Show the loading overlay
  3. POST to FastAPI /analyze
  4. On success, populate and show the result card
  5. On failure, show an inline error message
*/
async function handleSubmit() {
  clearStatus();

  const email      = emailInput.value.trim();
  const articleUrl = urlInput.value.trim();

  // Client-side validation before making any network request
  if (!email) {
    showStatus("Please enter your email address.");
    emailInput.focus();
    return;
  }

  if (!isValidEmail(email)) {
    showStatus("That does not look like a valid email address. Please check and try again.");
    emailInput.focus();
    return;
  }

  if (!articleUrl) {
    showStatus("Please paste the article URL you want to analyze.");
    urlInput.focus();
    return;
  }

  if (!isValidUrl(articleUrl)) {
    showStatus("That does not look like a valid URL. It should start with https:// or http://");
    urlInput.focus();
    return;
  }

  showLoading();

  try {
    // Send the data to our FastAPI backend
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email:       email,
        article_url: articleUrl,
      }),
    });

    // Parse the JSON body regardless of status code so we can read error details
    const data = await response.json();

    if (!response.ok) {
      // FastAPI sends { detail: "..." } for HTTP errors
      const detail = data.detail || "Something went wrong. Please try again.";
      throw new Error(detail);
    }

    // Success - populate the result card with session details
    resultSessionId.textContent = data.session_id;
    if (data.title) {
      resultUrl.innerHTML = `<a href="${articleUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none;">${data.title}</a>`;
    } else {
      resultUrl.textContent       = articleUrl;
    }
    resultEmail.textContent     = email;

    // Update status pill to completed
    const resultStatus = document.getElementById("result-status");
    if (resultStatus) {
      resultStatus.textContent = "Completed";
      resultStatus.className = "status-pill completed";
    }

    // Update result details text to represent completed state
    const resultTitle = document.getElementById("result-title");
    const resultSubtitle = document.getElementById("result-subtitle");
    const resultFooterNote = document.getElementById("result-footer-note");
    if (resultTitle) {
      resultTitle.textContent = "Analysis Completed";
    }
    if (resultSubtitle) {
      resultSubtitle.textContent = "Your article has been successfully analyzed by the AI workflow.";
    }
    if (resultFooterNote) {
      resultFooterNote.textContent = "The article was successfully scraped, summarized, and insights were extracted. The results have been emailed to you and saved to Google Sheets.";
    }

    // Swap the hero section for the result section
    heroSection.hidden   = true;
    resultSection.hidden = false;

  } catch (error) {
    // Network errors (n8n not running, wrong port, etc.) land here
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      showStatus(
        "Could not reach the backend. Make sure the FastAPI server is running on port 8000.",
        "warning"
      );
    } else {
      showStatus(error.message || "An unexpected error occurred.", "error");
    }
  } finally {
    // Always hide the loading state, success or failure
    hideLoading();
  }
}


// === Event Listeners ===

// Main submit button
submitBtn.addEventListener("click", handleSubmit);

// Allow submitting with the Enter key from either input field
emailInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") urlInput.focus(); // Tab forward to URL field on Enter
});

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSubmit();
});

// Clear the error message as soon as the user starts typing again
emailInput.addEventListener("input", clearStatus);
urlInput.addEventListener("input", clearStatus);

// Reset the form and show the hero section again for a fresh analysis
analyzeAgainBtn.addEventListener("click", () => {
  emailInput.value       = "";
  urlInput.value         = "";
  resultSection.hidden   = true;
  heroSection.hidden     = false;
  clearStatus();
  emailInput.focus();

  // Reset status pill to processing for the next run
  const resultStatus = document.getElementById("result-status");
  if (resultStatus) {
    resultStatus.textContent = "Processing";
    resultStatus.className = "status-pill processing";
  }

  // Reset result text elements to default processing state
  const resultTitle = document.getElementById("result-title");
  const resultSubtitle = document.getElementById("result-subtitle");
  const resultFooterNote = document.getElementById("result-footer-note");
  if (resultTitle) {
    resultTitle.textContent = "Analysis Submitted";
  }
  if (resultSubtitle) {
    resultSubtitle.textContent = "Your article is being processed by the AI workflow.";
  }
  if (resultFooterNote) {
    resultFooterNote.textContent = "The workflow is now scraping the article, summarizing it, and extracting insights. Results will be emailed to you and saved to Google Sheets.";
  }
});



// Focus the email field on page load so the user can start typing immediately
window.addEventListener("DOMContentLoaded", () => {
  emailInput.focus();
});
