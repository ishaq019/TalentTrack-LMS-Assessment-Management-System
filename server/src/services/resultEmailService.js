// server/src/services/resultEmailService.js
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const User = require("../models/User");
const { sendMail, wrapHtml } = require("../config/mailer");

/**
 * Send result email to student + admin.
 * @param {Object} params
 * @param {string} params.submissionId - MongoDB ObjectId of Submission
 */
async function sendResultEmails({ submissionId }) {
  // Load submission
  const submission = await Submission.findById(submissionId);
  if (!submission) return { ok: false, error: "Submission not found" };

  // Avoid double-sending (basic protection)
  if (submission.emailStatus?.studentSent && submission.emailStatus?.adminSent) {
    return { ok: true, skipped: true, message: "Result emails already sent" };
  }

  // Load assignment + test + users
  const assignment = await Assignment.findById(submission.assignmentId);
  if (!assignment) return { ok: false, error: "Assignment not found" };

  const test = await Test.findById(assignment.testId).select("metadata");
  if (!test) return { ok: false, error: "Test not found" };

  const student = await User.findById(submission.userId).select("name email");
  if (!student) return { ok: false, error: "Student not found" };

  const admin = await User.findById(assignment.assignedBy).select("name email");
  if (!admin) return { ok: false, error: "Admin not found" };

  const title = test.metadata.title;
  const category = test.metadata.category;

  const scoreLine = `${submission.score}/${submission.maxScore}`;
  const quizLine = `${submission.sectionScores?.quiz ?? 0}`;
  const codingLine = `${submission.sectionScores?.coding ?? 0}`;

  // Student email
  const studentSubject = `TalentTrack: Results for "${title}"`;
  const studentBody = `
    <p>Hi ${student.name || "Student"},</p>
    <p>Your test has been evaluated on <b>TalentTrack</b>.</p>
    <ul style="margin:10px 0 0 18px;">
      <li><b>Test:</b> ${title}</li>
      <li><b>Category:</b> ${category}</li>
      <li><b>Total Score:</b> ${scoreLine}</li>
      <li><b>Quiz Score:</b> ${quizLine}</li>
      <li><b>Coding Score:</b> ${codingLine}</li>
    </ul>
    <p style="margin-top:14px;">
      Breakdown: Quiz correct <b>${submission.breakdown?.quizCorrect ?? 0}</b> / <b>${submission.breakdown?.quizTotal ?? 0}</b>.
    </p>
    <p style="margin-top:14px;">Login to TalentTrack to view detailed results.</p>
  `;

  // Admin email
  const adminSubject = `TalentTrack: Student Result — ${student.email} — "${title}"`;
  const adminBody = `
    <p>Hi ${admin.name || "Admin"},</p>
    <p>A student has completed an assigned test on <b>TalentTrack</b>.</p>
    <ul style="margin:10px 0 0 18px;">
      <li><b>Student:</b> ${student.name || "-"} (${student.email})</li>
      <li><b>Test:</b> ${title}</li>
      <li><b>Category:</b> ${category}</li>
      <li><b>Total Score:</b> ${scoreLine}</li>
      <li><b>Quiz Score:</b> ${quizLine}</li>
      <li><b>Coding Score:</b> ${codingLine}</li>
      <li><b>Submitted At:</b> ${submission.submittedAt ? new Date(submission.submittedAt).toISOString() : "-"}</li>
    </ul>
    <p style="margin-top:14px;">Open TalentTrack admin dashboard to review submission details.</p>
  `;

  // Send emails (best-effort)
  const results = await Promise.allSettled([
    submission.emailStatus?.studentSent
      ? Promise.resolve({ skipped: "student already sent" })
      : sendMail({
          to: student.email,
          subject: studentSubject,
          html: wrapHtml({ title: "Your Test Results", bodyHtml: studentBody })
        }),
    submission.emailStatus?.adminSent
      ? Promise.resolve({ skipped: "admin already sent" })
      : sendMail({
          to: admin.email,
          subject: adminSubject,
          html: wrapHtml({ title: "Student Test Result", bodyHtml: adminBody })
        })
  ]);

  // Update status flags
  const studentOk = results[0].status === "fulfilled";
  const adminOk = results[1].status === "fulfilled";
  const lastError =
    results.find((r) => r.status === "rejected")?.reason?.message ||
    results.find((r) => r.status === "rejected")?.reason?.toString() ||
    "";

  submission.emailStatus = {
    studentSent: submission.emailStatus?.studentSent || studentOk,
    adminSent: submission.emailStatus?.adminSent || adminOk,
    lastError: lastError || submission.emailStatus?.lastError || ""
  };
  await submission.save();

  return {
    ok: true,
    studentSent: submission.emailStatus.studentSent,
    adminSent: submission.emailStatus.adminSent,
    lastError: submission.emailStatus.lastError
  };
}

module.exports = { sendResultEmails };
