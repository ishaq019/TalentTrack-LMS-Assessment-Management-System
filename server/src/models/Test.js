// server/src/models/Test.js
const mongoose = require("mongoose");

const QuizQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // e.g., "Q1"
    question: { type: String, required: true, maxlength: 2000 },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
        message: "Options must be an array of 2 to 6 strings"
      }
    },
    correctAnswer: { type: String, required: true }, // stored in DB, NOT sent to student
    explanation: { type: String, default: "", maxlength: 2000 }
  },
  { _id: false }
);

const CodingTestcaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true, maxlength: 20000 },
    output: { type: String, required: true, maxlength: 20000 },
    isSample: { type: Boolean, default: false } // exactly 2 should be true (enforced at validation layer later)
  },
  { _id: false }
);

const CodingProblemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // e.g., "P1"
    title: { type: String, required: true, maxlength: 200 },
    statement: { type: String, required: true, maxlength: 10000 },
    inputFormat: { type: String, default: "", maxlength: 2000 },
    outputFormat: { type: String, default: "", maxlength: 2000 },
    constraints: { type: String, default: "", maxlength: 2000 },

    // Languages supported: javascript + python (per your requirement)
    languages: {
      type: [String],
      default: ["javascript", "python"],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.length >= 1 &&
          arr.every((x) => ["javascript", "python"].includes(x)),
        message: "languages must contain only 'javascript' and/or 'python'"
      }
    },

    // Starter code per language (optional but recommended)
    starterCode: {
      javascript: { type: String, default: "function solve(input){\n  // TODO\n}\n" },
      python: { type: String, default: "def solve(input: str):\n    # TODO\n    pass\n" }
    },

    // Testcases (2 sample visible to user; rest hidden)
    testcases: { type: [CodingTestcaseSchema], default: [] }
  },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  {
    sectionType: {
      type: String,
      enum: ["quiz", "coding"],
      required: true
    },
    title: { type: String, required: true, maxlength: 120 },

    // Only for quiz
    questions: { type: [QuizQuestionSchema], default: [] },

    // Only for coding
    problems: { type: [CodingProblemSchema], default: [] }
  },
  { _id: false }
);

const TestSchema = new mongoose.Schema(
  {
    metadata: {
      id: { type: String, required: true, unique: true }, // like "T-APT-001"
      title: { type: String, required: true, maxlength: 120 },
      type: {
        type: String,
        enum: ["quiz", "coding", "mixed"],
        required: true
      },
      category: {
        type: String,
        required: true,
        maxlength: 40
      },
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "easy"
      },
      durationMinutes: { type: Number, required: true, min: 1, max: 300 },
      isPractice: { type: Boolean, default: false }
    },

    // Test-level configuration (admin may override during assignment)
    config: {
      questionCount: { type: Number, default: null }, // for quiz selection mode
      negativeMarking: { type: Number, default: 0 },
      scorePerTestcase: { type: Number, default: 10 } // coding
    },

    sections: { type: [SectionSchema], required: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null // null means system/built-in
    },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Helpful indexes
TestSchema.index({ "metadata.category": 1, "metadata.difficulty": 1 });
TestSchema.index({ "metadata.isPractice": 1 });

module.exports = mongoose.model("Test", TestSchema);
