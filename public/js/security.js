(() => {
  let csrfToken =
    document.querySelector('meta[name="csrf-token"]')?.content || "";
  const siteKey =
    document.querySelector('meta[name="captcha-site-key"]')?.content || "";
  const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  let lastClickedButton;
  let lastClickedAt = 0;

  const spinnerStyles = document.createElement("style");
  spinnerStyles.textContent = `
    button.secureaegix-button-loading {
      position: relative;
      color: transparent !important;
    }
    button.secureaegix-button-loading > :not(.secureaegix-button-spinner) {
      visibility: hidden !important;
    }
    .secureaegix-button-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      display: inline-block;
      width: 0.9em;
      height: 0.9em;
      margin: 0 !important;
      transform: translate(-50%, -50%);
      border: 2px solid;
      border-right-color: transparent;
      border-radius: 50%;
      animation: secureaegix-spin 0.7s linear infinite;
      visibility: visible !important;
    }
    @keyframes secureaegix-spin {
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
  `;
  document.head.appendChild(spinnerStyles);

  const setButtonLoading = (button, loading) => {
    if (!(button instanceof HTMLButtonElement)) return;
    let spinner = button.querySelector(":scope > .secureaegix-button-spinner");
    if (loading) {
      if (!spinner) {
        const buttonColor = window.getComputedStyle(button).color;
        spinner = document.createElement("span");
        spinner.className = "secureaegix-button-spinner";
        spinner.setAttribute("aria-hidden", "true");
        spinner.style.borderColor = buttonColor;
        spinner.style.borderRightColor = "transparent";
        button.appendChild(spinner);
      }
      button.classList.add("secureaegix-button-loading");
      button.setAttribute("aria-busy", "true");
    } else {
      spinner?.remove();
      button.classList.remove("secureaegix-button-loading");
      button.removeAttribute("aria-busy");
    }
  };

  window.setSecureButtonLoading = setButtonLoading;
  window.updateCsrfToken = (token) => {
    if (typeof token !== "string" || !token) return;
    csrfToken = token;
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) csrfMeta.content = token;
  };

  window.refreshSecureCsrfToken = async () => {
    const response = await nativeFetch("/api/csrf-token", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    const result = await response.json();
    if (!response.ok || !result.csrfToken) {
      throw new Error("Unable to refresh the security token. Please reload the page and try again.");
    }

    window.updateCsrfToken(result.csrfToken);
    document.querySelectorAll("form").forEach(addCsrfToken);
    return result.csrfToken;
  };

  window.showSecureFlash = (message, kind = "success") => {
    let root = document.getElementById("secureaegix-client-flash");
    if (!root) {
      root = document.createElement("div");
      root.id = "secureaegix-client-flash";
      root.className =
        "pointer-events-none fixed inset-x-0 top-6 z-[10000] flex justify-center px-4";
      root.setAttribute("aria-live", "polite");
      root.setAttribute("aria-atomic", "true");
      document.body.appendChild(root);
    }
    root.replaceChildren();

    const toast = document.createElement("div");
    const success = kind === "success";
    toast.className = success
      ? "pointer-events-auto flex max-w-lg items-start gap-3 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 text-white shadow-xl"
      : "pointer-events-auto flex max-w-lg items-start gap-3 rounded-xl border border-rose-400/40 bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4 text-white shadow-xl";

    const icon = document.createElement("i");
    icon.className = success
      ? "fas fa-circle-check mt-0.5"
      : "fas fa-circle-xmark mt-0.5";
    icon.setAttribute("aria-hidden", "true");
    const text = document.createElement("p");
    text.className = "text-sm font-medium";
    text.textContent = message;
    toast.append(icon, text);
    root.appendChild(toast);
    window.setTimeout(() => toast.remove(), 8000);
  };

  document.addEventListener(
    "click",
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest("button")
          : null;
      if (!button || button.disabled) return;
      lastClickedButton = button;
      lastClickedAt = Date.now();
      setButtonLoading(button, true);
      window.setTimeout(() => {
        if (
          !button.dataset.secureRequestPending &&
          !button.form?.dataset.secureCaptchaPending
        ) {
          setButtonLoading(button, false);
        }
      }, 900);
    },
    true,
  );

  const addCsrfToken = (form) => {
    let input = form.querySelector('input[name="_csrf"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "_csrf";
      form.appendChild(input);
    }
    input.value = csrfToken;
  };

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      addCsrfToken(form);
      const submitter =
        event.submitter ||
        form.querySelector('button[type="submit"], button:not([type])');
      if (submitter) {
        lastClickedButton = submitter;
        lastClickedAt = Date.now();
        setButtonLoading(submitter, true);
      }
      const action = form.dataset.captchaAction;
      if (!action || form.dataset.captchaReady === "true") {
        delete form.dataset.secureCaptchaPending;
        delete form.dataset.captchaReady;
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (form.dataset.captchaBusy === "true") return;

      form.dataset.captchaBusy = "true";
      form.dataset.secureCaptchaPending = "true";

      const fail = (message) => {
        delete form.dataset.captchaBusy;
        delete form.dataset.secureCaptchaPending;
        setButtonLoading(submitter, false);
        window.alert(message);
      };

      const loadTurnstile = () => {
        if (window.turnstile) return Promise.resolve(window.turnstile);
        if (window.turnstileLoadPromise) return window.turnstileLoadPromise;

        window.turnstileLoadPromise = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.onload = () =>
            window.turnstile
              ? resolve(window.turnstile)
              : reject(new Error("Turnstile did not initialize."));
          script.onerror = () =>
            reject(new Error("Turnstile could not be loaded."));
          document.head.appendChild(script);
        });
        return window.turnstileLoadPromise;
      };

      if (!siteKey) {
        fail("Security verification is unavailable. Please try again later.");
        return;
      }

      loadTurnstile()
        .then((turnstile) => {
          let widgetId;
          let container;
          let visibleFallbackShown = false;

          const clearWidget = () => {
            if (widgetId !== undefined) turnstile.remove(widgetId);
            container?.remove();
            widgetId = undefined;
            container = undefined;
          };

          const submitWithToken = (token) => {
            clearWidget();
            let tokenInput = form.querySelector(
              'input[name="captchaToken"]',
            );
            if (!tokenInput) {
              tokenInput = document.createElement("input");
              tokenInput.type = "hidden";
              tokenInput.name = "captchaToken";
              form.appendChild(tokenInput);
            }
            tokenInput.value = token;
            delete form.dataset.captchaBusy;
            delete form.dataset.secureCaptchaPending;
            form.dataset.captchaReady = "true";
            form.requestSubmit(submitter || undefined);
          };

          const renderChallenge = (visible) => {
            container = document.createElement("div");
            container.className = "my-4 flex justify-center";
            if (submitter?.parentElement) {
              submitter.parentElement.insertBefore(container, submitter);
            } else {
              form.appendChild(container);
            }

            const showFailure = (errorCode) => {
              if (!visible && !visibleFallbackShown) {
                visibleFallbackShown = true;
                console.warn(
                  "Invisible Turnstile challenge failed; showing an interactive challenge.",
                  errorCode,
                );
                clearWidget();
                setButtonLoading(submitter, false);
                renderChallenge(true);
                return;
              }

              console.error("Turnstile challenge failed:", errorCode);
              clearWidget();
              fail(
                "Security verification could not be completed. Please try submitting the form again.",
              );
            };

            try {
              widgetId = turnstile.render(container, {
                sitekey: siteKey,
                action,
                size: visible ? "normal" : "invisible",
                execution: visible ? "render" : "execute",
                appearance: visible ? "always" : "interaction-only",
                callback: submitWithToken,
                "error-callback": showFailure,
                "expired-callback": () => showFailure("expired"),
                "timeout-callback": () => showFailure("timeout"),
              });
              if (!visible) turnstile.execute(widgetId);
            } catch (error) {
              console.error("Turnstile initialization failed:", error);
              showFailure(error.message);
            }
          };

          renderChallenge(false);
        })
        .catch((error) => {
          console.error("Turnstile load failed:", error);
          fail("Security verification could not be loaded. Check your connection and try again.");
        });
    },
    true,
  );

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    try {
      const requestUrl = new URL(
        typeof input === "string" ? input : input.url,
        window.location.href,
      );
      const method = (
        init.method || (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      if (
        requestUrl.origin === window.location.origin &&
        unsafeMethods.has(method)
      ) {
        const headers = new Headers(
          init.headers || (input instanceof Request ? input.headers : undefined),
        );
        headers.set("X-CSRF-Token", csrfToken);
        init = { ...init, headers };

        const pendingButton =
          Date.now() - lastClickedAt < 10000 ? lastClickedButton : null;
        if (pendingButton) {
          pendingButton.dataset.secureRequestPending = "true";
          return nativeFetch(input, init).finally(() => {
            delete pendingButton.dataset.secureRequestPending;
            setButtonLoading(pendingButton, false);
            if (lastClickedButton === pendingButton) {
              lastClickedButton = null;
              lastClickedAt = 0;
            }
          });
        }
      }
    } catch (error) {
      console.error("Unable to attach the CSRF token to the request:", error);
      return Promise.reject(error);
    }
    return nativeFetch(input, init);
  };

  window.refreshSecureCsrfToken().catch((error) => {
    console.error("Unable to refresh the page security token:", error);
  });
})();
