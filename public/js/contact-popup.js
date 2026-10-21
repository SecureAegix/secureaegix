document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("contactPopup");
  const form = document.getElementById("contactPopupForm");
  const closeButton = document.getElementById("contactPopupClose");
  const status = document.getElementById("contactPopupStatus");
  const submitButton = document.getElementById("contactPopupSubmit");
  const nameInput = document.getElementById("contactPopupName");
  const popupDelay = 10 * 60 * 1000;
  const submissionDelay = 24 * 60 * 60 * 1000;
  const nextShowKey = "secureaegix.contactPopup.nextShow";
  const submittedKey = "secureaegix.contactPopup.submitted";

  if (popup && form && closeButton && status && submitButton && nameInput) {
    let nextShow = Date.now() + popupDelay;
    try {
      const wasSubmitted = localStorage.getItem(submittedKey) === "true";
      const storedNextShow = Number(localStorage.getItem(nextShowKey));
      if (wasSubmitted) {
        nextShow = Date.now() + submissionDelay;
        localStorage.setItem(nextShowKey, String(nextShow));
        localStorage.removeItem(submittedKey);
      } else if (storedNextShow) {
        nextShow = storedNextShow;
      } else {
        localStorage.setItem(nextShowKey, String(nextShow));
      }
    } catch (error) {
      console.error("Unable to initialize the contact popup preference:", error);
    }

    let popupTimer;

    const hidePopup = () => {
      popup.classList.add("hidden");
      popup.classList.remove("flex");
      popup.setAttribute("aria-hidden", "true");
      document.body.classList.remove("overflow-hidden");
    };

    const closePopup = (reschedule = true) => {
      hidePopup();
      if (reschedule) {
        try {
          nextShow = Date.now() + popupDelay;
          localStorage.setItem(nextShowKey, String(nextShow));
        } catch (error) {
          console.error("Unable to save the contact popup preference:", error);
          nextShow = Date.now() + popupDelay;
        }
        schedulePopup(popupDelay);
      }
    };

    const openPopup = () => {
      popup.classList.remove("hidden");
      popup.classList.add("flex");
      popup.setAttribute("aria-hidden", "false");
      document.body.classList.add("overflow-hidden");
      nameInput.focus();
    };

    const schedulePopup = (delay) => {
      window.clearTimeout(popupTimer);
      popupTimer = window.setTimeout(openPopup, Math.max(0, delay));
    };

    schedulePopup(nextShow - Date.now());

    closeButton.addEventListener("click", () => closePopup());
    popup.addEventListener("click", (event) => {
      if (event.target === popup) closePopup();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && popup.getAttribute("aria-hidden") === "false") closePopup();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.className = "hidden rounded-lg px-3 py-2 text-sm";
      submitButton.disabled = true;
      window.setSecureButtonLoading?.(submitButton, true);

      try {
        const csrfToken =
          document.querySelector('meta[name="csrf-token"]')?.content || "";
        const body = new URLSearchParams(new FormData(form));
        if (csrfToken && !body.has("_csrf")) {
          body.set("_csrf", csrfToken);
        }

        const response = await fetch(form.action, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body
        });
        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error(
            response.ok
              ? "The server returned an unexpected response. Please try again."
              : `We couldn't send your details (HTTP ${response.status}). Please try again.`,
          );
        }
        if (!response.ok || !result.success) {
          throw new Error(result.message || "We couldn't send your details. Please try again.");
        }

        status.textContent = result.message;
        status.className = "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
        window.showSecureFlash?.(result.message, "success");
        try {
          nextShow = Date.now() + submissionDelay;
          localStorage.setItem(nextShowKey, String(nextShow));
          localStorage.removeItem(submittedKey);
        } catch (error) {
          console.error("Unable to save the contact popup submission state:", error);
        }
        window.clearTimeout(popupTimer);
        window.setTimeout(() => closePopup(false), 1800);
      } catch (error) {
        console.error("Contact popup submission failed:", error);
        status.textContent = error.message || "We couldn't send your details. Please try again.";
        status.className = "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200";
        window.showSecureFlash?.(status.textContent, "error");
      } finally {
        submitButton.disabled = false;
        window.setSecureButtonLoading?.(submitButton, false);
      }
    });
  }

  const toggle = document.getElementById("contactAssistantToggle");
  const options = document.getElementById("contactAssistantOptions");
  const chatPanel = document.getElementById("contactChatPanel");
  const chatClose = document.getElementById("contactChatClose");
  const chatForm = document.getElementById("contactChatForm");
  const chatInput = document.getElementById("contactChatInput");
  const chatMessages = document.getElementById("contactChatMessages");
  const chatStatus = document.getElementById("contactChatStatus");
  const chatSend = document.getElementById("contactChatSend");
  const chatTyping = document.getElementById("contactChatTyping");
  const toggleIcon = document.getElementById("contactAssistantToggleIcon");
  const history = [];

  if (!toggle || !options || !chatPanel || !chatClose || !chatForm || !chatInput || !chatMessages || !chatStatus || !chatSend || !chatTyping || !toggleIcon) return;

  const setToggleIcon = (isOpen) => {
    toggleIcon.classList.toggle("fa-headset", !isOpen);
    toggleIcon.classList.toggle("fa-xmark", isOpen);
    toggle.setAttribute("aria-label", isOpen ? "Close contact options" : "Open contact options");
  };

  const closeChat = () => {
    chatPanel.classList.add("hidden");
    chatPanel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    setToggleIcon(false);
  };

  const openChat = () => {
    options.classList.remove("is-open");
    options.setAttribute("aria-hidden", "true");
    chatPanel.classList.remove("hidden");
    chatPanel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "false");
    setToggleIcon(true);
    chatInput.focus();
  };

  const addMessage = (text, sender) => {
    const message = document.createElement("p");
    message.className = sender === "user"
      ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-cyan-700 px-3 py-2 text-sm text-white"
      : "mr-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    message.textContent = text;
    chatMessages.append(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const addRecommendations = (recommendations) => {
    if (!Array.isArray(recommendations) || !recommendations.length) return;
    const list = document.createElement("div");
    list.className = "grid gap-2";
    recommendations.forEach((item) => {
      if (!item || typeof item.title !== "string" || typeof item.url !== "string" || !item.url.startsWith("/")) return;
      const link = document.createElement("a");
      link.href = item.url;
      link.className = "block rounded-xl border border-gray-200 bg-white p-3 text-sm hover:border-cyan-600 dark:border-gray-600 dark:bg-gray-800";
      const title = document.createElement("span");
      title.className = "block font-semibold text-gray-900 dark:text-white";
      title.textContent = item.title;
      const description = document.createElement("span");
      description.className = "mt-1 block text-xs text-gray-600 dark:text-gray-300";
      description.textContent = item.description || item.type || "Explore this page";
      link.append(title, description);
      list.append(link);
    });
    if (list.childElementCount) chatMessages.append(list);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  toggle.addEventListener("click", () => {
    if (!chatPanel.classList.contains("hidden")) {
      closeChat();
      return;
    }
    const isOpen = options.classList.toggle("is-open");
    options.setAttribute("aria-hidden", String(!isOpen));
    toggle.setAttribute("aria-expanded", String(isOpen));
    setToggleIcon(isOpen);
  });

  options.querySelectorAll("[data-assistant-action='chat']").forEach((button) => {
    button.addEventListener("click", openChat);
  });
  chatClose.addEventListener("click", closeChat);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeChat();
      options.classList.remove("is-open");
      options.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      setToggleIcon(false);
    }
  });

  document.querySelectorAll("[data-chat-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      chatInput.value = button.dataset.chatPrompt;
      chatForm.requestSubmit();
    });
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || chatSend.disabled) return;

    addMessage(message, "user");
    chatInput.value = "";
    chatStatus.textContent = "SecureAegix assistant is thinking…";
    chatTyping.classList.remove("hidden");
    chatTyping.classList.add("flex");
    chatSend.disabled = true;

    try {
      const payload = JSON.stringify({ message, history: history.slice(-8) });
      const sendChatMessage = (csrfToken) => fetch("/api/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: payload
      });
      let response = await sendChatMessage(
        document.querySelector('meta[name="csrf-token"]')?.content || "",
      );
      let result = await response.json();
      if (response.status === 403 && result.code === "CSRF_TOKEN_INVALID") {
        const tokenResponse = await fetch("/api/csrf-token", {
          credentials: "same-origin",
          headers: { "Accept": "application/json" },
          cache: "no-store",
        });
        const tokenResult = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenResult.csrfToken) {
          throw new Error("Your session could not be refreshed. Please reload the page and try again.");
        }
        window.updateCsrfToken?.(tokenResult.csrfToken);
        response = await sendChatMessage(tokenResult.csrfToken);
        result = await response.json();
      }
      if (!response.ok) throw new Error(result.message || "The assistant is temporarily unavailable.");
      addMessage(result.reply, "assistant");
      addRecommendations(result.recommendations);
      history.push({ role: "user", text: message }, { role: "model", text: result.reply });
      chatStatus.textContent = "";
    } catch (error) {
      console.error("Chat request failed:", error);
      addMessage(error.message || "I couldn't respond just now. Please try again.", "assistant");
      chatStatus.textContent = "";
    } finally {
      chatTyping.classList.add("hidden");
      chatTyping.classList.remove("flex");
      chatSend.disabled = false;
      chatInput.focus();
    }
  });
});
