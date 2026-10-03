const productNameInput = document.getElementById("productName");
const categoryInput = document.getElementById("category");
const productDetailsInput = document.getElementById("details");
const languageInput = document.getElementById("language");

const titleOutput = document.getElementById("titleOutput");
const descriptionOutput = document.getElementById("descriptionOutput");
const sellingPointsOutput = document.getElementById("featuresOutput");
const captionOutput = document.getElementById("captionOutput");

const generateButton = document.getElementById("generateBtn");
const buttonText = document.getElementById("buttonText");
const loader = document.getElementById("loader");

const emptyState = document.getElementById("emptyState");
const resultContent = document.getElementById("resultContent");
const copyAllButton = document.getElementById("copyAllBtn");


// ========================================
// GENERATE LISTING
// ========================================

if (generateButton) {
  generateButton.addEventListener("click", async () => {

    const productName = productNameInput?.value.trim() || "";
    const category = categoryInput?.value.trim() || "";
    const productDetails = productDetailsInput?.value.trim() || "";
    const language = languageInput?.value || "English";

    // Validation
    if (!productName) {
      alert("Please enter a product name.");
      productNameInput?.focus();
      return;
    }

    if (!productDetails) {
      alert("Please enter your product details.");
      productDetailsInput?.focus();
      return;
    }

    // Loading state
    generateButton.disabled = true;

    if (buttonText) {
      buttonText.textContent = "Generating with AI...";
    }

    if (loader) {
      loader.classList.remove("hidden");
    }

    try {

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productName,
          category,
          productDetails,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Something went wrong. Please try again."
        );
      }

      // ========================================
      // DISPLAY TITLE
      // ========================================

      if (titleOutput) {
        titleOutput.textContent = data.title || "";
      }

      // ========================================
      // DISPLAY DESCRIPTION
      // ========================================

      if (descriptionOutput) {
        descriptionOutput.textContent = data.description || "";
      }

      // ========================================
      // DISPLAY SELLING POINTS
      // ========================================

      if (sellingPointsOutput) {

        sellingPointsOutput.innerHTML = "";

        const points = Array.isArray(data.sellingPoints)
          ? data.sellingPoints
          : [];

        points.forEach((point) => {

          const div = document.createElement("div");

          div.textContent = "• " + point;

          div.style.marginBottom = "8px";

          sellingPointsOutput.appendChild(div);

        });
      }

      // ========================================
      // DISPLAY SOCIAL CAPTION
      // ========================================

      if (captionOutput) {
        captionOutput.textContent = data.caption || "";
      }

      // ========================================
      // SHOW RESULTS
      // ========================================

      if (emptyState) {
        emptyState.classList.add("hidden");
      }

      if (resultContent) {
        resultContent.classList.remove("hidden");
      }

      // Scroll to results
      if (resultContent) {
        resultContent.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

    } catch (error) {

      console.error("SellerBoost AI Error:", error);

      alert(
        error.message ||
        "Unable to generate content. Please try again."
      );

    } finally {

      generateButton.disabled = false;

      if (buttonText) {
        buttonText.textContent = "Generate Listing ✨";
      }

      if (loader) {
        loader.classList.add("hidden");
      }

    }

  });
}


// ========================================
// COPY BUTTONS
// ========================================

document.addEventListener("click", async (event) => {

  const button = event.target.closest("[data-copy]");

  if (!button) return;

  const targetId = button.getAttribute("data-copy");

  const target = document.getElementById(targetId);

  if (!target) return;

  const text = target.innerText || target.textContent || "";

  try {

    await navigator.clipboard.writeText(text);

    const originalText = button.textContent;

    button.textContent = "Copied ✓";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);

  } catch (error) {

    console.error("Copy failed:", error);

    alert("Could not copy. Please copy the text manually.");

  }

});


// ========================================
// COPY ALL
// ========================================

if (copyAllButton) {

  copyAllButton.addEventListener("click", async () => {

    const title = titleOutput?.innerText || "";
    const description = descriptionOutput?.innerText || "";
    const points = sellingPointsOutput?.innerText || "";
    const caption = captionOutput?.innerText || "";

    const fullText = `
PRODUCT TITLE
${title}

DESCRIPTION
${description}

KEY SELLING POINTS
${points}

WHATSAPP / SOCIAL CAPTION
${caption}
`.trim();

    try {

      await navigator.clipboard.writeText(fullText);

      const originalText = copyAllButton.textContent;

      copyAllButton.textContent = "Copied ✓";

      setTimeout(() => {
        copyAllButton.textContent = originalText;
      }, 1500);

    } catch (error) {

      console.error("Copy all failed:", error);

    }

  });

}
