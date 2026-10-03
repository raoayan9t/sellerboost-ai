document.addEventListener("DOMContentLoaded", () => {
  const productName = document.getElementById("productName");
  const category = document.getElementById("category");
  const details = document.getElementById("details");
  const language = document.getElementById("language");

  const generateBtn = document.getElementById("generateBtn");
  const buttonText = document.getElementById("buttonText");
  const loader = document.getElementById("loader");

  const emptyState = document.getElementById("emptyState");
  const resultContent = document.getElementById("resultContent");

  const titleOutput = document.getElementById("titleOutput");
  const descriptionOutput = document.getElementById("descriptionOutput");
  const featuresOutput = document.getElementById("featuresOutput");
  const captionOutput = document.getElementById("captionOutput");

  const copyAllBtn = document.getElementById("copyAllBtn");

  // ============================
  // GENERATE
  // ============================

  generateBtn.addEventListener("click", async () => {

    const name = productName.value.trim();
    const cat = category.value.trim();
    const productDetails = details.value.trim();
    const lang = language.value;

    if (!name) {
      alert("Please enter a product name.");
      productName.focus();
      return;
    }

    if (!productDetails) {
      alert("Please enter your product details.");
      details.focus();
      return;
    }

    generateBtn.disabled = true;

    if (buttonText) {
      buttonText.textContent = "Generating...";
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
          productName: name,
          category: cat,
          productDetails: productDetails,
          language: lang
        })
      });

      const data = await response.json();

      console.log("SellerBoost response:", data);

      if (!response.ok) {
        throw new Error(
          data.error || "AI generation failed."
        );
      }

      titleOutput.textContent = data.title || "";

      descriptionOutput.textContent = data.description || "";

      featuresOutput.innerHTML = "";

      if (Array.isArray(data.sellingPoints)) {
        data.sellingPoints.forEach((point) => {
          const div = document.createElement("div");
          div.textContent = "• " + point;
          div.style.marginBottom = "8px";
          featuresOutput.appendChild(div);
        });
      }

      captionOutput.textContent = data.caption || "";

      emptyState.classList.add("hidden");
      resultContent.classList.remove("hidden");

      resultContent.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {

      console.error("SellerBoost error:", error);

      alert(
        "Error: " + error.message
      );

    } finally {

      generateBtn.disabled = false;

      if (buttonText) {
        buttonText.textContent = "Generate Listing ✨";
      }

      if (loader) {
        loader.classList.add("hidden");
      }

    }
  });


  // ============================
  // COPY BUTTONS
  // ============================

  document.addEventListener("click", async (event) => {

    const button = event.target.closest("[data-copy]");

    if (!button) return;

    const targetId = button.getAttribute("data-copy");

    const target = document.getElementById(targetId);

    if (!target) return;

    try {

      await navigator.clipboard.writeText(
        target.innerText || target.textContent
      );

      const oldText = button.textContent;

      button.textContent = "Copied ✓";

      setTimeout(() => {
        button.textContent = oldText;
      }, 1500);

    } catch (error) {
      console.error("Copy error:", error);
    }
  });


  // ============================
  // COPY ALL
  // ============================

  if (copyAllBtn) {

    copyAllBtn.addEventListener("click", async () => {

      const text = `
PRODUCT TITLE
${titleOutput.innerText}

DESCRIPTION
${descriptionOutput.innerText}

KEY SELLING POINTS
${featuresOutput.innerText}

WHATSAPP / SOCIAL CAPTION
${captionOutput.innerText}
      `.trim();

      try {

        await navigator.clipboard.writeText(text);

        const oldText = copyAllBtn.textContent;

        copyAllBtn.textContent = "Copied ✓";

        setTimeout(() => {
          copyAllBtn.textContent = oldText;
        }, 1500);

      } catch (error) {
        console.error("Copy all error:", error);
      }

    });

  }

});
