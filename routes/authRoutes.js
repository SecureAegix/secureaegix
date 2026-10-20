const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller.js");
const { saveRedirectUrl, setMetatag } = require("../middleware.js");
const verifyCaptcha = require("../middleware/captcha.js");
const {
  passwordResetLimiter,
  resetPasswordLimiter,
} = require("../middleware/rateLimits.js");

router.get("/forgot-password", authController.restform);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  verifyCaptcha("forgot_password"),
  saveRedirectUrl,
  authController.forgotPassword,
);
router.get("/reset-password/:token", authController.getResetPassword);
router.post(
  "/reset-password/:token",
  resetPasswordLimiter,
  authController.postResetPassword,
);

//router.get("/ibsa/task", homeController.addtask);

module.exports = router;
