const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home.js");
const { isLoggedIn, isAdmin, saveRedirectUrl } = require("../middleware");
const multer = require("multer");
const { storage } = require("../Cloudconfig.js");
const upload = multer({ storage });

router.route("/").get(homeController.homePage);
router.get("/profile", isLoggedIn, homeController.profile);

router.get("/about", homeController.about);
router.get("/privacy", homeController.privacy);
router.get("/terms", homeController.terms);
router.get("/contact", homeController.contact);

// courses
router
  .route("/courses")
  .get(homeController.allCourses)
  .post(
    upload.single("image"),
    isLoggedIn,
    isAdmin,
    homeController.createNewCourse,
  );
router.get(
  "/courses/new",
  isLoggedIn,
  isAdmin,
  homeController.renderNewCourseForm,
);
// Render edit form
router.get(
  "/courses/:id/edit",
  isLoggedIn,
  isAdmin,
  homeController.renderEditCourseForm,
);

// Update course (PATCH)
router
  .route("/courses/:id")
  .get(homeController.viewCourse)
  .put(upload.single("image"), isLoggedIn, isAdmin, homeController.updateCourse)
  .delete(isLoggedIn, isAdmin, homeController.deleteCourse)
  .patch(isLoggedIn, isAdmin, homeController.toggleActive);

router.patch(
  "/courses/:id/popular",
  isLoggedIn,
  isAdmin,
  homeController.togglePopular,
);

router.patch(
  "/courses/:id/toggle-navbar",
  isLoggedIn,
  isAdmin,
  homeController.toggleNavbarVisibility,
);
router.patch(
  "/courses/:id/toggle-homepage",
  isLoggedIn,
  isAdmin,
  homeController.toggleHomepageVisibility,
);

router
  .route("/enroll")
  .get(homeController.enrollCourseForm)
  .post(isLoggedIn, saveRedirectUrl, homeController.enrollCourse);

router
  .route("/enroll/:courseId")
  // .get(homeController.enrollNowCourseForm)
  .post(isLoggedIn, homeController.enrollInNewCource);

module.exports = router;
