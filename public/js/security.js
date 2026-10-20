(() => {
  const csrfToken =
    document.querySelector('meta[name="csrf-token"]')?.content || "";
  const siteKey =
    document.querySelector('meta[name="captcha-site-key"]')?.content || "";
  const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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
      const action = form.dataset.captchaAction;
      if (!action || form.dataset.captchaReady === "true") {
        delete form.dataset.captchaReady;
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (form.dataset.captchaBusy === "true") return;

      const submitter = event.submitter;
      form.dataset.captchaBusy = "true";

      const fail = (message) => {
        delete form.dataset.captchaBusy;
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
          const container = document.createElement("div");
          container.style.position = "fixed";
          container.style.right = "16px";
          container.style.bottom = "16px";
          container.style.zIndex = "9999";
          document.body.appendChild(container);

          let widgetId;
          const clearWidget = () => {
            if (widgetId !== undefined) turnstile.remove(widgetId);
            container.remove();
          };
          const showFailure = () => {
            clearWidget();
            fail("Security verification failed. Please submit the form again.");
          };

          try {
            widgetId = turnstile.render(container, {
              sitekey: siteKey,
              action,
              size: "invisible",
              execution: "execute",
              appearance: "interaction-only",
              callback: (token) => {
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
                form.dataset.captchaReady = "true";
                form.requestSubmit(submitter || undefined);
              },
              "error-callback": showFailure,
              "expired-callback": showFailure,
              "timeout-callback": showFailure,
            });
            turnstile.execute(widgetId);
          } catch (error) {
            console.error("Turnstile initialization failed:", error);
            showFailure();
          }
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
      }
    } catch (error) {
      console.error("Unable to attach the CSRF token to the request:", error);
      return Promise.reject(error);
    }
    return nativeFetch(input, init);
  };
})();
