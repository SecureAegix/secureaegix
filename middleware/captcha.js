const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function sendFailure(req, res, status, message) {
  const expectsJson =
    req.path.startsWith("/api/") ||
    req.is("application/json") ||
    req.xhr ||
    req.get("accept")?.includes("application/json");

  if (expectsJson) {
    return res.status(status).json({ success: false, message });
  }

  req.flash("error", message);
  const referer = req.get("referer");
  try {
    const refererUrl = new URL(referer);
    if (refererUrl.host === req.get("host")) {
      return res.redirect(`${refererUrl.pathname}${refererUrl.search}`);
    }
  } catch {
    // Fall through to a safe local destination.
  }
  return res.redirect("/");
}

module.exports = function verifyTurnstile(action) {
  return async (req, res, next) => {
    const secret = process.env.CAPTCHA_SECRET_KEY;
    const siteKey = process.env.CAPTCHA_SITE_KEY;
    const token = req.body?.captchaToken;

    if (!secret || !siteKey) {
      console.error("Turnstile CAPTCHA is not configured.");
      return sendFailure(
        req,
        res,
        503,
        "Security verification is temporarily unavailable. Please try again later.",
      );
    }

    if (typeof token !== "string" || !token.trim()) {
      return sendFailure(
        req,
        res,
        400,
        "Please complete the security verification and try again.",
      );
    }

    try {
      const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!verifyResponse.ok) {
        throw new Error(`Turnstile verification returned HTTP ${verifyResponse.status}`);
      }

      const verification = await verifyResponse.json();
      const verifiedHostname = verification.hostname?.toLowerCase();
      const requestHostname = req.hostname?.toLowerCase();
      const allowedHostnames = (process.env.CAPTCHA_ALLOWED_HOSTNAMES || "")
        .split(",")
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean);
      const hostnamesMatch =
        verifiedHostname &&
        requestHostname &&
        (allowedHostnames.length
          ? allowedHostnames.includes(verifiedHostname) &&
            allowedHostnames.includes(requestHostname)
          : verifiedHostname === requestHostname);

      if (
        !verification.success ||
        verification.action !== action ||
        !hostnamesMatch
      ) {
        console.error("Turnstile verification rejected:", {
          errorCodes: verification["error-codes"] || [],
          expectedAction: action,
          verifiedAction: verification.action || null,
          verifiedHostname: verifiedHostname || null,
          requestHostname: requestHostname || null,
          allowedHostnames: allowedHostnames.length ? allowedHostnames : null,
        });
        return sendFailure(
          req,
          res,
          400,
          "Security verification failed. Please try again.",
        );
      }

      return next();
    } catch (error) {
      console.error("Turnstile verification request failed:", error.message);
      return sendFailure(
        req,
        res,
        503,
        "Security verification is temporarily unavailable. Please try again later.",
      );
    }
  };
};
