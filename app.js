const form = document.getElementById("generatorForm");

const productNameInput = document.getElementById("productName");
const categoryInput = document.getElementById("category");
const productDetailsInput = document.getElementById("productDetails");
const languageInput = document.getElementById("language");

const titleOutput = document.getElementById("titleOutput");
const descriptionOutput = document.getElementById("descriptionOutput");
const sellingPointsOutput = document.getElementById("sellingPointsOutput");
const captionOutput = document.getElementById("captionOutput");

const generateButton = document.getElementById("generateBtn");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const productName = productNameInput?.value.trim();
    const category = categoryInput?.value.trim();
    const productDetails = productDetailsInput?.value.trim();
    const language = languageInput?.value || "English";

    if (!productName || !productDetails) {
      alert("Please enter the product name and product details.");
      return;
    }

    // Loading state
    const originalButtonText = generateButton
      ? generateButton.innerHTML
      : "";

    if (generateButton) {
      generateButton.disabled = true;
      generateButton.innerHTML = "Generating with AI ✨";
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

      // Product title
      if (titleOutput) {
        titleOutput.textContent = data.title || "";
      }

      // Description
      if (descriptionOutput) {
        descriptionOutput.textContent = data.description || "";
      }

      // Selling points
      if (sellingPointsOutput) {
        sellingPointsOutput.innerHTML = "";

        const points = Array.isArray(data.sellingPoints)
          ? data.sellingPoints
          : [];

        points.forEach((point) => {
          const li = document.createElement("li");
          li.textContent = point;
          sellingPointsOutput.appendChild(li);
        });
      }

      // WhatsApp / Social caption
      if (captionOutput) {
        captionOutput.textContent = data.caption || "";
      }

      // Scroll to results
      const results = document.querySelector(".results");

      if (results) {
        results.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

    } catch (error) {
      console.error("SellerBoost AI:", error);

      alert(
        error.message ||
        "Unable to generate content. Please try again."
      );

    } finally {
      if (generateButton) {
        generateButton.disabled = false;
        generateButton.innerHTML = originalButtonText;
      }
    }
  });
}


// ==============================
// COPY BUTTONS
// ==============================

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");

  if (!button) return;

  const targetId = button.getAttribute("data-copy");
  const target = document.getElementById(targetId);

  if (!target) return;

  const text = target.innerText || target.textContent || "";

  try {
    await navigator.clipboard.writeText(text);

    const originalText = button.innerText;

    button.innerText = "Copied ✓";

    setTimeout(() => {
      button.innerText = originalText;
    }, 1500);

  } catch (error) {
    console.error("Copy failed:", error);
  }
});
