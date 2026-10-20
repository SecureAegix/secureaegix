const express = require("express");
const router = express.Router();
const othersController = require("../controllers/others");
const verifyCaptcha = require("../middleware/captcha.js");
const {
  contactLimiter,
  subscribeLimiter,
} = require("../middleware/rateLimits.js");

router.post(
  "/contact",
  contactLimiter,
  verifyCaptcha("contact"),
  othersController.contact,
);
router.post(
  "/subscribe",
  subscribeLimiter,
  verifyCaptcha("subscribe"),
  othersController.subscribe,
);
router.get("/careers", othersController.carriers);

module.exports = router;
