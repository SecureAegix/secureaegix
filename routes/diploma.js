/**
 * Diploma Program Routes
 * Handles all routing for the 1-Year Advanced Diploma in Cybersecurity
 * Created: 2026-01-15
 * 
 * Routes:
 * - GET  /diploma              - Main diploma landing page
 * - GET  /diploma/curriculum   - Complete syllabus page
 * - GET  /diploma/enroll       - Enrollment form page
 * - POST /api/diploma/enroll   - Submit enrollment application (API)
 * - GET  /api/diploma/stats    - Get enrollment statistics (Admin only)
 * - PUT  /api/diploma/enrollment/:id - Update enrollment status (Admin only)
 */

const express = require("express");
const router = express.Router();

// Import controllers
const diplomaController = require("../controllers/diploma");

// Import middleware
const { isLoggedIn, isAdmin, saveRedirectUrl } = require("../middleware");

// ==================== PAGE ROUTES (GET) ====================

/**
 * Main Diploma Page
 * Displays complete information about the 1-Year Advanced Diploma program
 * Features: Program overview, highlights, curriculum summary, career paths
 */
router.get("/diploma", diplomaController.diplomaPage);

/**
 * Curriculum Page
 * Displays complete syllabus with all 12 modules and detailed topics
 * Interactive accordion design for better user experience
 */
router.get("/diploma/curriculum", diplomaController.curriculumPage);

/**
 * Enrollment Page
 * Displays enrollment form for the diploma program
 * Auto-fills data if user is logged in
 */
router.get("/diploma/enroll", diplomaController.enrollPage);

// ==================== API ROUTES (POST/PUT/GET) ====================

/**
 * Submit Enrollment Application
 * Endpoint: POST /api/diploma/enroll
 * Body Parameters: fullName, email, phone, city, qualification, mode, batch, message
 * Returns: JSON response with success/failure status
 */
router.post("/api/diploma/enroll", diplomaController.submitEnrollment);

/**
 * Get Enrollment Statistics (Admin Only)
 * Endpoint: GET /api/diploma/stats
 * Requires: Admin authentication
 * Returns: Enrollment statistics and recent applications
 */
router.get("/api/diploma/stats", isLoggedIn, isAdmin, diplomaController.getEnrollmentStats);

/**
 * Update Enrollment Status (Admin Only)
 * Endpoint: PUT /api/diploma/enrollment/:id
 * Requires: Admin authentication
 * Body Parameters: status, adminNotes
 * Returns: Updated enrollment data
 */
router.put("/api/diploma/enrollment/:id", isLoggedIn, isAdmin, diplomaController.updateEnrollmentStatus);

// ==================== EXPORT ROUTER ====================

module.exports = router;