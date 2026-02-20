// server/src/controllers/userAssignmentController.js
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Test = require("../models/Test");
const { scoreSubmission } = require("../services/scoringService");
const { sendResultEmails } = require("../services/resultEmailService");

/**
 * Helper: check expiry and mark assignment expired if needed.
 */
async function ensureNotExpired(assignment) {
  if (assignment.status === "expired") return { ok: false, error: "Assignment expired." };

  const now = new Date();
  if (assignment.expiresAt <= now && assignment.status !== "submitted") {
    assignment.status = "expired";
    await assignment.save();
    return { ok: false, error: "Assignment expired." };
  }
  return { ok: true };
}

/**
 * GET /me/assignments
 */
async function listMyAssignments(req, res, next) {
  try {
    const userId = req.user.id;

    // Exclude self-assigned practice sessions (assignedBy === assignedTo)
    const assignments = await Assignment.find({
      assignedTo: userId,
      $expr: { $ne: ["$assignedBy", "$assignedTo"] }
    })
      .sort({ createdAt: -1 })
      .populate("testId", "metadata isActive")
      .select("testId status expiresAt attemptLimit overrideConfig startedAt submittedAt createdAt");

    return res.json({ ok: true, assignments });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /me/assignments/:assignmentId/start
 */
async function startAssignment(req, res, next) {
  try {
    const userId = req.user.id;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, assignedTo: userId });
    if (!assignment) return res.status(404).json({ ok: false, error: "Assignment not found." });

    const exp = await ensureNotExpired(assignment);
    if (!exp.ok) return res.status(403).json(exp);

    if (assignment.status === "submitted") {
      return res.status(400).json({ ok: false, error: "Assignment already submitted." });
    }

    if (assignment.status === "assigned") {
      assignment.status = "in_progress";
      assignment.startedAt = new Date();
      await assignment.save();

      await Submission.updateOne(
        { assignmentId: assignment._id },
        {
          $setOnInsert: {
            assignmentId: assignment._id,
            userId,
            startedAt: assignment.startedAt
          }
        },
        { upsert: true }
      );
    }

    return res.json({ ok: true, message: "Assignment started.", assignment });
  } catch (err) {
    return next(err);
  }
}

/**
 * Student-safe test view:
 * - quiz correctAnswer removed
 * - only sample testcases exposed
 */
function buildStudentTestView(testDoc) {
  const test = testDoc.toObject();

  test.sections = (test.sections || []).map((section) => {
    if (section.sectionType === "quiz") {
      return {
        sectionType: "quiz",
        title: section.title,
        questions: (section.questions || []).map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options
        }))
      };
    }

    if (section.sectionType === "coding") {
      return {
        sectionType: "coding",
        title: section.title,
        problems: (section.problems || []).map((p) => ({
          id: p.id,
          title: p.title,
          statement: p.statement,
          inputFormat: p.inputFormat,
          outputFormat: p.outputFormat,
          constraints: p.constraints,
          languages: p.languages,
          starterCode: p.starterCode,
          testcases: (p.testcases || [])
            .filter((tc) => tc.isSample === true)
            .map((tc) => ({
              input: tc.input,
              output: tc.output,
              isSample: true
            }))
        }))
      };
    }

    return section;
  });

  return test;
}

/**
 * GET /me/assignments/:assignmentId
 */
async function getMyAssignmentDetail(req, res, next) {
  try {
    const userId = req.user.id;
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, assignedTo: userId })
      .populate("testId")
      .select("testId status expiresAt attemptLimit overrideConfig startedAt submittedAt createdAt");

    if (!assignment) return res.status(404).json({ ok: false, error: "Assignment not found." });

    const exp = await ensureNotExpired(assignment);
    if (!exp.ok) return res.status(403).json(exp);

    const testDoc = assignment.testId;
    if (!testDoc || !testDoc.isActive) {
      return res.status(404).json({ ok: false, error: "Test not found or inactive." });
    }

    const studentTest = buildStudentTestView(testDoc);

    const effectiveConfig = {
      durationMinutes: assignment.overrideConfig?.durationMinutes ?? testDoc.metadata.durationMinutes,
      questionCount: assignment.overrideConfig?.questionCount ?? testDoc.config?.questionCount ?? null
    };

    return res.json({
      ok: true,
      assignment: {
        id: assignment._id,
        status: assignment.status,
        expiresAt: assignment.expiresAt,
        startedAt: assignment.startedAt,
        submittedAt: assignment.submittedAt,
        attemptLimit: assignment.attemptLimit,
        effectiveConfig
      },
      test: studentTest
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /me/assignments/:assignmentId/submit
 * Body: { quizAnswers?:[], coding?:[{problemId,language,sourceCode}] }
 *
 * Now:
 * - scores quiz + coding via runner
 * - stores safe coding results (2 sample detailed, hidden summary)
 * - sends result emails (best-effort)
 */
async function submitAssignment(req, res, next) {
  try {
    const userId = req.user.id;
    const { assignmentId } = req.params;
    const { quizAnswers = [], coding = [] } = req.body;

    const assignment = await Assignment.findOne({ _id: assignmentId, assignedTo: userId });
    if (!assignment) return res.status(404).json({ ok: false, error: "Assignment not found." });

    const exp = await ensureNotExpired(assignment);
    if (!exp.ok) return res.status(403).json(exp);

    if (assignment.status === "submitted") {
      return res.status(400).json({ ok: false, error: "Already submitted." });
    }

    const testDoc = await Test.findById(assignment.testId);
    if (!testDoc || !testDoc.isActive) {
      return res.status(404).json({ ok: false, error: "Test not found or inactive." });
    }

    assignment.status = "submitted";
    assignment.submittedAt = new Date();
    await assignment.save();

    // REAL scoring: quiz + coding via runner
    const scoring = await scoreSubmission({
      testDoc,
      quizAnswers,
      codingSubmissions: coding
    });

    const submission = await Submission.findOneAndUpdate(
      { assignmentId: assignment._id, userId },
      {
        $set: {
          submittedAt: assignment.submittedAt,
          quizAnswers,
          // store evaluated coding results (safe)
          coding: scoring.codingResults,
          score: scoring.score,
          maxScore: scoring.maxScore,
          sectionScores: scoring.sectionScores,
          breakdown: scoring.breakdown
        }
      },
      { new: true, upsert: true }
    );

    const emailResult = await sendResultEmails({ submissionId: submission._id }).catch((e) => ({
      ok: false,
      error: e?.message || "Email send failed"
    }));

    return res.json({
      ok: true,
      message: "Submitted and evaluated.",
      submission: {
        id: submission._id,
        score: submission.score,
        maxScore: submission.maxScore,
        sectionScores: submission.sectionScores,
        breakdown: submission.breakdown
      },
      emailStatus: emailResult,
      scoringMode: scoring.scoringMode
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMyAssignments,
  startAssignment,
  getMyAssignmentDetail,
  submitAssignment,
  getMyDashboard,
  listPracticeTests,
  startPractice
};

/**
 * GET /me/dashboard
 * Return summary stats for the current user
 */
async function getMyDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();

    const assignments = await Assignment.find({ assignedTo: userId })
      .select("status expiresAt submittedAt createdAt");

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const assignedActive = assignments.filter(
      (a) => a.status !== "submitted" && a.status !== "expired" && a.expiresAt > now
    ).length;

    const assignedExpired = assignments.filter(
      (a) => a.status === "expired" || (a.expiresAt <= now && a.status !== "submitted")
    ).length;

    const assignedTakenThisMonth = assignments.filter(
      (a) => a.status === "submitted" && a.submittedAt && a.submittedAt >= thisMonth
    ).length;

    return res.json({
      ok: true,
      stats: {
        assignedActive,
        assignedExpired,
        practiceTakenThisMonth: 0, // practice not yet tracked
        assignedTakenThisMonth
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /me/practice-tests
 * Return tests marked as practice (isPractice = true)
 */
async function listPracticeTests(req, res, next) {
  try {
    const tests = await Test.find({ "metadata.isPractice": true, isActive: true })
      .sort({ createdAt: -1 })
      .select("metadata isActive createdAt");

    return res.json({ ok: true, tests });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /me/practice/start
 * Body: { testId }
 * Creates a self-assignment for practice
 */
async function startPractice(req, res, next) {
  try {
    const userId = req.user.id;
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({ ok: false, error: "testId is required" });
    }

    const test = await Test.findById(testId);
    if (!test || !test.isActive) {
      return res.status(404).json({ ok: false, error: "Test not found or inactive" });
    }

    // Create a practice assignment (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const assignment = await Assignment.create({
      testId: test._id,
      assignedTo: userId,
      assignedBy: userId, // self-assigned
      expiresAt,
      attemptLimit: 10,
      status: "in_progress",
      startedAt: new Date(),
      overrideConfig: {
        durationMinutes: test.metadata?.durationMinutes || null,
        questionCount: null
      }
    });

    // Create initial submission record
    await Submission.updateOne(
      { assignmentId: assignment._id },
      {
        $setOnInsert: {
          assignmentId: assignment._id,
          userId,
          startedAt: assignment.startedAt
        }
      },
      { upsert: true }
    );

    return res.json({
      ok: true,
      assignmentId: assignment._id,
      message: "Practice session started"
    });
  } catch (err) {
    return next(err);
  }
}
