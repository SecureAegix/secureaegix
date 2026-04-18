const express = require("express");
const router = express.Router();
const { isLoggedIn, isAdmin, saveRedirectUrl } = require("../middleware");
const serviceController = require("../controllers/service");

router.get("/penetration-testing", serviceController.penetrationTesting);
router.get("/vulnerability-assessment", serviceController.vulnerabilityAssessment);
router.get("/incident-response", serviceController.incidentResponse);
router.get("/red-team", serviceController.redTeamOperations);
module.exports = router;