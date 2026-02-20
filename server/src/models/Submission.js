// server/src/models/Submission.js
const mongoose = require("mongoose");

const QuizAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true }, // "Q1"
    selectedOption: { type: String, required: true } // store chosen option text
  },
  { _id: false }
);

const CodingRunSummarySchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true }, // "P1"
    language: { type: String, enum: ["javascript", "python"], required: true },
    sourceCode: { type: String, required: true, maxlength: 200000 },

    // Detailed results ONLY for sample testcases (visible ones)
    sampleResults: {
      type: [
        {
          input: { type: String, required: true },
          expectedOutput: { type: String, required: true },
          actualOutput: { type: String, required: true, default: "" },
          passed: { type: Boolean, required: true },
          runtimeMs: { type: Number, default: null },
          error: { type: String, default: "" }
        }
      ],
      default: []
    },

    // Hidden results are summarized to reduce leakage
    hiddenSummary: {
      total: { type: Number, default: 0 },
      passed: { type: Number, default: 0 }
    }
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },

    // Quiz answers (if assignment includes quiz sections)
    quizAnswers: { type: [QuizAnswerSchema], default: [] },

    // Coding submissions (if assignment includes coding sections)
    coding: { type: [CodingRunSummarySchema], default: [] },

    // Scoring
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    sectionScores: {
      quiz: { type: Number, default: 0 },
      coding: { type: Number, default: 0 }
    },

    // Optional: store breakdown for UI (avoid leaking correct answers)
    breakdown: {
      quizCorrect: { type: Number, default: 0 },
      quizTotal: { type: Number, default: 0 },
      codingPassedHidden: { type: Number, default: 0 },
      codingTotalHidden: { type: Number, default: 0 }
    },

    // Email status (results)
    emailStatus: {
      studentSent: { type: Boolean, default: false },
      adminSent: { type: Boolean, default: false },
      lastError: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

SubmissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", SubmissionSchema);
