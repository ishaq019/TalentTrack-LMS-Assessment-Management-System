// server/src/controllers/reportController.js
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { sendMail, wrapHtml } = require("../config/mailer");

/**
 * GET /me/reports/monthly
 * Generate an on-demand monthly report for the current user
 */
async function getMonthlyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Assignments this month
    const assignments = await Assignment.find({
      assignedTo: userId,
      createdAt: { $gte: monthStart, $lte: monthEnd }
    }).select("status submittedAt");

    const assignedTotal = assignments.length;
    const assignedCompleted = assignments.filter((a) => a.status === "submitted").length;

    // Submissions this month
    const submissions = await Submission.find({
      userId,
      submittedAt: { $gte: monthStart, $lte: monthEnd }
    }).select("score maxScore");

    const avgScore =
      submissions.length > 0
        ? Math.round(
            submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
          )
        : 0;

    const breakdown = [
      { label: "Total Assigned", value: assignedTotal },
      { label: "Completed", value: assignedCompleted },
      { label: "Submissions", value: submissions.length },
      { label: "Avg Score", value: avgScore }
    ];

    return res.json({
      ok: true,
      report: {
        monthName,
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        assignedTotal,
        assignedCompleted,
        practiceTaken: 0,
        breakdown
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /me/reports/monthly/email
 * Email the current user their monthly report
 */
async function emailMonthlyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name email");

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

    const assignments = await Assignment.find({
      assignedTo: userId,
      createdAt: { $gte: monthStart, $lte: monthEnd }
    }).select("status");

    const submissions = await Submission.find({
      userId,
      submittedAt: { $gte: monthStart, $lte: monthEnd }
    }).select("score maxScore");

    const assignedTotal = assignments.length;
    const assignedCompleted = assignments.filter((a) => a.status === "submitted").length;

    const avgScore =
      submissions.length > 0
        ? Math.round(
            submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
          )
        : 0;

    const bodyHtml = `
      <p>Hi ${user.name || "Student"},</p>
      <p>Here is your monthly report for <b>${monthName}</b>:</p>
      <table style="border-collapse:collapse;margin:12px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Total Assigned</td><td style="font-weight:700;">${assignedTotal}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Completed</td><td style="font-weight:700;">${assignedCompleted}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Submissions</td><td style="font-weight:700;">${submissions.length}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Average Score</td><td style="font-weight:700;">${avgScore}</td></tr>
      </table>
      <p>Keep up the great work!</p>
    `;

    await sendMail({
      to: user.email,
      subject: `TalentTrack Monthly Report — ${monthName}`,
      html: wrapHtml({ title: "Monthly Report", bodyHtml }),
      text: `TalentTrack Monthly Report (${monthName}): Assigned ${assignedTotal}, Completed ${assignedCompleted}, Submissions ${submissions.length}, Avg Score ${avgScore}`
    });

    return res.json({ ok: true, message: "Report emailed successfully" });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMonthlyReport,
  emailMonthlyReport
};
