// server/src/controllers/adminAssignmentController.js
const Test = require("../models/Test");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const { sendMail, wrapHtml } = require("../config/mailer");

/**
 * POST /admin/assignments
 * Body:
 * {
 *   testId: "<mongoObjectId>",
 *   userIds: ["<userId1>", "<userId2>"],
 *   expiresAt: "2026-03-01T10:00:00.000Z",
 *   overrideConfig: { durationMinutes?: number, questionCount?: number },
 *   attemptLimit?: number
 * }
 */
async function assignTest(req, res, next) {
  try {
    const { testId, userIds, expiresAt, overrideConfig, attemptLimit } = req.body;

    if (!testId || !Array.isArray(userIds) || userIds.length === 0 || !expiresAt) {
      return res.status(400).json({ ok: false, error: "testId, userIds[], and expiresAt are required" });
    }

    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime())) {
      return res.status(400).json({ ok: false, error: "Invalid expiresAt date" });
    }
    if (expiry <= new Date()) {
      return res.status(400).json({ ok: false, error: "expiresAt must be in the future" });
    }

    const test = await Test.findById(testId).select("metadata isActive");
    if (!test || !test.isActive) {
      return res.status(404).json({ ok: false, error: "Test not found or inactive" });
    }

    // Fetch only students (role=user)
    const students = await User.find({ _id: { $in: userIds }, role: "user" }).select("email name role");
    if (students.length === 0) {
      return res.status(404).json({ ok: false, error: "No valid students found in userIds" });
    }

    // Create assignments (one per student)
    const docs = students.map((u) => ({
      testId: test._id,
      assignedTo: u._id,
      assignedBy: req.user.id,
      expiresAt: expiry,
      attemptLimit: attemptLimit ?? 1,
      overrideConfig: {
        durationMinutes: overrideConfig?.durationMinutes ?? null,
        questionCount: overrideConfig?.questionCount ?? null
      }
    }));

    // InsertMany is efficient for bulk assigns
    const created = await Assignment.insertMany(docs, { ordered: false });

    // Send emails (simple for MVP; can move to background job later)
    // Email includes expiry + title
    const emailPromises = students.map((u) => {
      const subject = "TalentTrack: New Test Assigned";
      const bodyHtml = `
        <p>Hi ${u.name || "Student"},</p>
        <p>You have been assigned a new test on <b>TalentTrack</b>.</p>
        <ul style="margin:10px 0 0 18px;">
          <li><b>Test:</b> ${test.metadata.title}</li>
          <li><b>Category:</b> ${test.metadata.category}</li>
          <li><b>Expires At:</b> ${expiry.toISOString()}</li>
        </ul>
        <p style="margin-top:14px;">Login to TalentTrack to start your assignment before it expires.</p>
      `;
      return sendMail({
        to: u.email,
        subject,
        html: wrapHtml({ title: "New Test Assigned", bodyHtml })
      });
    });

    // Fire and wait (MVP). If SMTP fails, you’ll see error; later we’ll add retries.
    await Promise.allSettled(emailPromises);

    return res.status(201).json({
      ok: true,
      message: `Assigned '${test.metadata.title}' to ${created.length} student(s)`,
      assignedCount: created.length
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /admin/assignments
 * Query filters:
 * - status=assigned|in_progress|submitted|expired
 * - userId=<studentId>
 * - testId=<testId>
 */
async function listAssignments(req, res, next) {
  try {
    const { status, userId, testId } = req.query;

    const filter = {};
    if (status) filter.status = String(status);
    if (userId) filter.assignedTo = String(userId);
    if (testId) filter.testId = String(testId);

    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .populate("testId", "metadata")
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    return res.json({ ok: true, assignments });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  assignTest,
  listAssignments
};
