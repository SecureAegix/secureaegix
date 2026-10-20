const rateLimit = require("express-rate-limit");

function createLimiter(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {
      const message = "Too many requests. Please try again later.";
      if (
        req.path.startsWith("/api/") ||
        req.is("application/json") ||
        req.get("accept")?.includes("application/json")
      ) {
        return res.status(429).json({ success: false, message });
      }
      return res.status(429).type("text").send(message);
    },
  });
}

module.exports = {
  globalLimiter: createLimiter(15 * 60 * 1000, 1000),
  loginLimiter: createLimiter(15 * 60 * 1000, 10),
  signupLimiter: createLimiter(60 * 60 * 1000, 8),
  verificationLimiter: createLimiter(15 * 60 * 1000, 10),
  passwordResetLimiter: createLimiter(60 * 60 * 1000, 5),
  resetPasswordLimiter: createLimiter(15 * 60 * 1000, 10),
  contactLimiter: createLimiter(15 * 60 * 1000, 8),
  subscribeLimiter: createLimiter(60 * 60 * 1000, 5),
  diplomaEnrollmentLimiter: createLimiter(60 * 60 * 1000, 5),
  courseEnrollmentLimiter: createLimiter(15 * 60 * 1000, 10),
};
