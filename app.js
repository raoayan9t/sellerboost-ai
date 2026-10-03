const SUPABASE_URL = "https://yypthtqsmyclsyujlhzf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4ydhzaZ-vKoDgbNHcwim6Q_R9S72BbO";

const { createClient } = window.supabase;
const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

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
  // AUTH UI
  // ============================

  const authModal = document.getElementById("authModal");
  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const authSwitchBtn = document.getElementById("authSwitchBtn");
  const authMessage = document.getElementById("authMessage");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const closeAuthBtn = document.getElementById("closeAuthBtn");
  const loginNavBtn = document.getElementById("loginNavBtn");
  const userMenu = document.getElementById("userMenu");
  const userEmail = document.getElementById("userEmail");
  const logoutBtn = document.getElementById("logoutBtn");

  let authMode = "login";
  let currentUser = null;

  function setAuthMessage(message = "", type = "") {
    authMessage.textContent = message;
    authMessage.className = "auth-message" + (type ? " " + type : "");
  }

  function openAuth(mode = "login") {
    authMode = mode;
    authTitle.textContent = mode === "login" ? "Welcome back" : "Create your account";
    authSubtitle.textContent = mode === "login"
      ? "Log in to use your SellerBoost AI workspace."
      : "Create your free account and start generating listings.";
    authSubmitBtn.textContent = mode === "login" ? "Log In" : "Create Account";
    authSwitchBtn.innerHTML = mode === "login"
      ? "Don't have an account? <strong>Sign up</strong>"
      : "Already have an account? <strong>Log in</strong>";
    authPassword.autocomplete = mode === "login" ? "current-password" : "new-password";
    setAuthMessage("");
    authModal.classList.remove("hidden");
    authModal.setAttribute("aria-hidden", "false");
    setTimeout(() => authEmail.focus(), 50);
  }

  function closeAuth() {
    authModal.classList.add("hidden");
    authModal.setAttribute("aria-hidden", "true");
    setAuthMessage("");
  }

  function updateAuthUI(user) {
    currentUser = user;

    if (user) {
      loginNavBtn.classList.add("hidden");
      userMenu.classList.remove("hidden");
      userEmail.textContent = user.email || "Account";
    } else {
      loginNavBtn.classList.remove("hidden");
      userMenu.classList.add("hidden");
      userEmail.textContent = "";
    }
  }

  loginNavBtn.addEventListener("click", () => openAuth("login"));

  authSwitchBtn.addEventListener("click", () => {
    openAuth(authMode === "login" ? "signup" : "login");
  });

  closeAuthBtn.addEventListener("click", closeAuth);

  authModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-auth]")) {
      closeAuth();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !authModal.classList.contains("hidden")) {
      closeAuth();
    }
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || password.length < 6) {
      setAuthMessage("Please enter a valid email and a password with at least 6 characters.", "error");
      return;
    }

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = authMode === "login" ? "Logging in..." : "Creating account...";
    setAuthMessage("");

    try {
      if (authMode === "login") {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        updateAuthUI(data.user);
        closeAuth();
        document.getElementById("generator").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } else {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        if (data.session) {
          updateAuthUI(data.user);
          closeAuth();
          document.getElementById("generator").scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        } else {
          setAuthMessage(
            "Account created. Please check your email if confirmation is required, then log in.",
            "success"
          );
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setAuthMessage(error.message || "Authentication failed. Please try again.", "error");
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = authMode === "login" ? "Log In" : "Create Account";
    }
  });

  logoutBtn.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    updateAuthUI(null);
    emptyState.classList.remove("hidden");
    resultContent.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session?.user || null);
  });

  // Restore existing Supabase session on page load.
  supabaseClient.auth.getSession().then(({ data }) => {
    updateAuthUI(data.session?.user || null);
  });

  // ============================
  // GENERATE
  // ============================

  generateBtn.addEventListener("click", async () => {
    if (!currentUser) {
      openAuth("login");
      return;
    }

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

    if (buttonText) buttonText.textContent = "Generating...";
    if (loader) loader.classList.remove("hidden");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productName: name,
          category: cat,
          productDetails,
          language: lang
        })
      });

      const data = await response.json();

      console.log("SellerBoost response:", data);

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed.");
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
      alert("Error: " + error.message);
    } finally {
      generateBtn.disabled = false;

      if (buttonText) buttonText.textContent = "Generate Listing ✨";
      if (loader) loader.classList.add("hidden");
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
