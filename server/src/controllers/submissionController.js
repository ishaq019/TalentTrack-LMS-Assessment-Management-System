// server/src/controllers/submissionController.js
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");

/**
 * GET /me/submissions/:assignmentId
 * Student can view their submission + results
 */
async function getMySubmissionByAssignment(req, res, next) {
  try {
    const userId = req.user.id;
    const { assignmentId } = req.params;

    const submission = await Submission.findOne({ assignmentId, userId }).select(
      "assignmentId userId startedAt submittedAt score maxScore sectionScores breakdown coding emailStatus createdAt"
    );

    if (!submission) {
      return res.status(404).json({ ok: false, error: "Submission not found." });
    }

    return res.json({ ok: true, submission });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /admin/submissions/:assignmentId
 * Admin can view submission with context (student + test meta)
 */
async function getAdminSubmissionByAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;

    const submission = await Submission.findOne({ assignmentId }).select(
      "assignmentId userId startedAt submittedAt score maxScore sectionScores breakdown coding emailStatus createdAt"
    );

    if (!submission) {
      return res.status(404).json({ ok: false, error: "Submission not found." });
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .select("testId assignedTo assignedBy expiresAt status startedAt submittedAt createdAt overrideConfig");

    if (!assignment) {
      return res.status(404).json({ ok: false, error: "Assignment not found." });
    }

    const test = await Test.findById(assignment.testId).select("metadata");

    return res.json({
      ok: true,
      context: {
        assignment,
        testMetadata: test?.metadata || null
      },
      submission
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMySubmissionByAssignment,
  getAdminSubmissionByAssignment,
  listMySubmissions,
  listAllSubmissions
};

/**
 * GET /me/submissions
 * List all submissions for the current user
 */
async function listMySubmissions(req, res, next) {
  try {
    const userId = req.user.id;

    const submissions = await Submission.find({ userId })
      .sort({ submittedAt: -1 })
      .populate({
        path: "assignmentId",
        select: "testId",
        populate: {
          path: "testId",
          select: "metadata"
        }
      })
      .select("assignmentId userId startedAt submittedAt score maxScore sectionScores createdAt");

    // Flatten for frontend convenience
    const result = submissions.map((s) => {
      const obj = s.toObject();
      const test = obj.assignmentId?.testId;
      return {
        ...obj,
        testTitle: test?.metadata?.title || "Untitled",
        testType: test?.metadata?.type || "quiz",
        test: test ? { metadata: test.metadata } : null
      };
    });

    return res.json({ ok: true, submissions: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /admin/submissions
 * List all submissions (admin view) with user + test info
 */
async function listAllSubmissions(req, res, next) {
  try {
    const submissions = await Submission.find({})
      .sort({ submittedAt: -1 })
      .populate({
        path: "assignmentId",
        select: "testId assignedTo",
        populate: [
          { path: "testId", select: "metadata" },
          { path: "assignedTo", select: "name email" }
        ]
      })
      .select("assignmentId userId startedAt submittedAt score maxScore sectionScores createdAt");

    const result = submissions.map((s) => {
      const obj = s.toObject();
      const assignment = obj.assignmentId;
      const test = assignment?.testId;
      const user = assignment?.assignedTo;
      return {
        ...obj,
        assignmentId: assignment?._id?.toString() || obj.assignmentId?.toString?.() || null,
        testTitle: test?.metadata?.title || "Untitled",
        testType: test?.metadata?.type || "quiz",
        userName: user?.name || "Student",
        userEmail: user?.email || "—",
        test: test ? { metadata: test.metadata } : null,
        user: user || null
      };
    });

    return res.json({ ok: true, submissions: result });
  } catch (err) {
    return next(err);
  }
}
