// server/src/routes/adminRoutes.js
const express = require("express");

const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const { createTest, listTests, toggleTestActive } = require("../controllers/adminTestController");
const { assignTest, listAssignments } = require("../controllers/adminAssignmentController");
const { getAdminSubmissionByAssignment, listAllSubmissions } = require("../controllers/submissionController");

const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Test = require("../models/Test");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("admin"));

// ── Tests ────────────────────────────────────────
router.post("/tests", createTest);
router.get("/tests", listTests);
router.patch("/tests/:id/toggle", toggleTestActive);

// ── Assignments ──────────────────────────────────
router.post("/assignments", assignTest);
router.get("/assignments", listAssignments);

// ── Users (list students for assignment UI) ──────
router.get("/users", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select("name email role isVerified createdAt").sort({ createdAt: -1 });
    return res.json({ ok: true, users });
  } catch (err) {
    return next(err);
  }
});

// ── Submissions ──────────────────────────────────
router.get("/submissions", listAllSubmissions);
router.get("/submissions/:assignmentId", getAdminSubmissionByAssignment);

// ── Overview (dashboard stats) ───────────────────
router.get("/overview", async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [userCount, testCount, activeAssignments, submissionsThisMonth] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Test.countDocuments({ isActive: true }),
      Assignment.countDocuments({ status: { $in: ["assigned", "in_progress"] }, expiresAt: { $gt: now } }),
      Submission.countDocuments({ submittedAt: { $gte: monthStart } })
    ]);

    return res.json({
      ok: true,
      stats: {
        users: userCount,
        tests: testCount,
        activeAssignments,
        submissionsThisMonth
      }
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
