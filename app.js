const generateBtn = document.getElementById("generateBtn");
const buttonText = document.getElementById("buttonText");
const loader = document.getElementById("loader");

const emptyState = document.getElementById("emptyState");
const resultContent = document.getElementById("resultContent");

const productName = document.getElementById("productName");
const category = document.getElementById("category");
const details = document.getElementById("details");
const language = document.getElementById("language");

const titleOutput = document.getElementById("titleOutput");
const descriptionOutput = document.getElementById("descriptionOutput");
const featuresOutput = document.getElementById("featuresOutput");
const captionOutput = document.getElementById("captionOutput");


// Generate demo listing
generateBtn.addEventListener("click", () => {

  const product = productName.value.trim();
  const productCategory = category.value.trim();
  const productDetails = details.value.trim();
  const selectedLanguage = language.value;

  if (!product) {
    alert("Please enter a product name.");
    productName.focus();
    return;
  }

  if (!productDetails) {
    alert("Please enter some product details.");
    details.focus();
    return;
  }

  generateBtn.disabled = true;
  buttonText.classList.add("hidden");
  loader.classList.remove("hidden");

  setTimeout(() => {

    const cleanCategory = productCategory || "Online Store";

    if (selectedLanguage === "Roman Urdu") {

      titleOutput.textContent =
        `${product} — Premium ${cleanCategory} Product`;

      descriptionOutput.textContent =
        `${product} aapki daily needs ke liye ek practical aur convenient choice hai. ` +
        `Is product ko use karna simple hai aur iska design online shoppers ke liye attractive hai. ` +
        `Product details: ${productDetails}`;

      featuresOutput.innerHTML = `
        <ul>
          <li>Practical aur easy-to-use design</li>
          <li>Daily use ke liye convenient</li>
          <li>Simple aur user-friendly</li>
          <li>Online shopping ke liye attractive option</li>
          <li>Product details ke mutabiq useful features</li>
        </ul>
      `;

      captionOutput.textContent =
        `🔥 ${product} ab available hai!\n\n` +
        `✨ Practical design\n` +
        `✨ Easy to use\n` +
        `✨ Great for everyday use\n\n` +
        `📩 Order karne ke liye message karein!`;

    } else if (selectedLanguage === "Urdu") {

      titleOutput.textContent =
        `${product} — بہترین ${cleanCategory} پروڈکٹ`;

      descriptionOutput.textContent =
        `${product} روزمرہ استعمال کے لیے ایک آسان اور مفید انتخاب ہے۔ ` +
        `اس کا استعمال سادہ ہے اور آن لائن خریداروں کے لیے ایک بہترین آپشن ہو سکتا ہے۔ ` +
        `پروڈکٹ کی تفصیلات: ${productDetails}`;

      featuresOutput.innerHTML = `
        <ul>
          <li>آسان اور عملی ڈیزائن</li>
          <li>روزمرہ استعمال کے لیے مفید</li>
          <li>استعمال میں آسان</li>
          <li>آن لائن شاپنگ کے لیے بہترین انتخاب</li>
          <li>دی گئی پروڈکٹ تفصیلات کے مطابق خصوصیات</li>
        </ul>
      `;

      captionOutput.textContent =
        `🔥 ${product} اب دستیاب ہے!\n\n` +
        `✨ بہترین ڈیزائن\n` +
        `✨ استعمال میں آسان\n` +
        `✨ روزمرہ استعمال کے لیے مفید\n\n` +
        `📩 آرڈر کے لیے ہمیں میسج کریں!`;

    } else {

      titleOutput.textContent =
        `${product} — Premium ${cleanCategory} Product`;

      descriptionOutput.textContent =
        `${product} is a practical and convenient choice for everyday use. ` +
        `Designed to provide a simple and useful experience for online shoppers. ` +
        `Product details: ${productDetails}`;

      featuresOutput.innerHTML = `
        <ul>
          <li>Practical and easy-to-use design</li>
          <li>Convenient for everyday use</li>
          <li>Simple and user-friendly</li>
          <li>Attractive option for online shoppers</li>
          <li>Features based on the provided product details</li>
        </ul>
      `;

      captionOutput.textContent =
        `🔥 ${product} is now available!\n\n` +
        `✨ Practical design\n` +
        `✨ Easy to use\n` +
        `✨ Great for everyday use\n\n` +
        `📩 Message us to place your order!`;

    }

    emptyState.classList.add("hidden");
    resultContent.classList.remove("hidden");

    generateBtn.disabled = false;
    buttonText.classList.remove("hidden");
    loader.classList.add("hidden");

    resultContent.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 700);
});


// Copy individual result
document.querySelectorAll(".small-copy").forEach(button => {

  button.addEventListener("click", async () => {

    const targetId = button.dataset.copy;
    const target = document.getElementById(targetId);

    const text = target.innerText || target.textContent;

    await navigator.clipboard.writeText(text);

    const original = button.textContent;

    button.textContent = "Copied ✓";

    setTimeout(() => {
      button.textContent = original;
    }, 1200);

  });

});


// Copy everything
document.getElementById("copyAllBtn").addEventListener("click", async () => {

  const text = `
PRODUCT TITLE

${titleOutput.textContent}

DESCRIPTION

${descriptionOutput.textContent}

KEY SELLING POINTS

${featuresOutput.innerText}

WHATSAPP / SOCIAL CAPTION

${captionOutput.textContent}
  `.trim();

  await navigator.clipboard.writeText(text);

  const button = document.getElementById("copyAllBtn");

  button.textContent = "Copied ✓";

  setTimeout(() => {
    button.textContent = "Copy All";
  }, 1500);

});
