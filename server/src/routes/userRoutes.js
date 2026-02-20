// server/src/routes/userRoutes.js
const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const {
  listMyAssignments,
  startAssignment,
  getMyAssignmentDetail,
  submitAssignment,
  getMyDashboard,
  listPracticeTests,
  startPractice
} = require("../controllers/userAssignmentController");

const {
  getMySubmissionByAssignment,
  listMySubmissions
} = require("../controllers/submissionController");

const {
  getMonthlyReport,
  emailMonthlyReport
} = require("../controllers/reportController");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["user", "admin"]));

// Profile: GET /me  (returns current user info)
router.get("/", async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id).select("name email role isVerified createdAt lastLoginAt");
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
});

// Dashboard stats
router.get("/dashboard", getMyDashboard);

// Assignments
router.get("/assignments", listMyAssignments);
router.post("/assignments/:assignmentId/start", startAssignment);
router.get("/assignments/:assignmentId", getMyAssignmentDetail);
router.post("/assignments/:assignmentId/submit", submitAssignment);

// Practice tests
router.get("/practice-tests", listPracticeTests);
router.post("/practice/start", startPractice);

// Submissions
router.get("/submissions", listMySubmissions);
router.get("/submissions/:assignmentId", getMySubmissionByAssignment);

// Reports
router.get("/reports/monthly", getMonthlyReport);
router.post("/reports/monthly/email", emailMonthlyReport);

module.exports = router;
