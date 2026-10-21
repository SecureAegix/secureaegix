const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const {
  saveRedirectUrl,
  isVerified,
  isLoggedIn,
  isAdmin,
} = require("../middleware.js");
const multer = require("multer");
const upload = multer();
const userController = require("../controllers/users.js");
const csrfProtection = require("../middleware/csrf.js");
const verifyCaptcha = require("../middleware/captcha.js");
const {
  signupLimiter,
  loginLimiter,
  verificationLimiter,
} = require("../middleware/rateLimits.js");
const LOGIN_CAPTCHA_THRESHOLD = 4;
const LOGIN_CAPTCHA_WINDOW_MS = 15 * 60 * 1000;

// signup GET
//Signup POST
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(signupLimiter, wrapAsync(userController.signup));

//Login GET
//Login POST
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    loginLimiter,
    (req, res, next) => {
      if ((req.rateLimit?.used || 0) < LOGIN_CAPTCHA_THRESHOLD) return next();

      req.session.loginCaptchaRequiredUntil =
        Date.now() + LOGIN_CAPTCHA_WINDOW_MS;
      return verifyCaptcha("login")(req, res, next);
    },
    isVerified,
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login,
  );

router.post("/logout", isLoggedIn, userController.logout);

router.post(
  "/verify/:id/resend",
  verificationLimiter,
  userController.resendOtp,
);
router.get("/verify-email", userController.renderVerifyEmailForm);
router.post(
  "/verify/:id",
  verificationLimiter,
  userController.verifyEmail,
);

router.get("/profile", isLoggedIn, userController.profile);
router.post(
  "/profile/update",
  upload.none(),
  csrfProtection,
  isLoggedIn,
  userController.updateProfile,
);
router.post(
  "/profile/change-password",
  isLoggedIn,
  userController.changePassword,
);
router.get(
  "/profile/enrollments",
  isLoggedIn,
  userController.enrollmentHistory,
);

router.get("/my-courses", isLoggedIn, userController.myCourses);
router.get("/certificates", isLoggedIn, userController.myCertificates);

// Generate certificate SVG
// router.get(
//   "/certificates/:id/svg",
//   isLoggedIn,
//   userController.generateCertificateSVG,
// );

// In your routes file
router.post(
  "/certificate/issue",
  isLoggedIn,
  isAdmin,
  userController.issueCertificate,
);

// Download certificate as image
router.get(
  "/certificates/:id/download/image",
  isLoggedIn,
  userController.downloadCertificateImage,
);

// Download certificate as PDF
router.get(
  "/certificates/:id/download/pdf",
  isLoggedIn,
  userController.downloadCertificatePDF,
);

module.exports = router;
