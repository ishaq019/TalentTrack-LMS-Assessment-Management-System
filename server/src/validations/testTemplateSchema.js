// server/src/validations/testTemplateSchema.js
const { z } = require("zod");

const MetadataSchema = z.object({
  id: z.string().min(3).max(50),
  title: z.string().min(3).max(120),
  type: z.enum(["quiz", "coding", "mixed"]),
  category: z.string().min(2).max(40),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  durationMinutes: z.number().int().min(1).max(300),
  isPractice: z.boolean().default(false)
});

const ConfigSchema = z
  .object({
    questionCount: z.number().int().min(1).max(500).nullable().optional(),
    negativeMarking: z.number().min(0).max(5).optional(),
    scorePerTestcase: z.number().int().min(1).max(100).optional()
  })
  .default({ negativeMarking: 0, scorePerTestcase: 10 });

const QuizQuestionSchema = z.object({
  id: z.string().min(1).max(30),
  question: z.string().min(3).max(2000),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correctAnswer: z.string().min(1).max(300),
  explanation: z.string().max(2000).optional().default("")
}).superRefine((q, ctx) => {
  // Ensure correctAnswer is one of the options (avoids broken quizzes)
  if (!q.options.includes(q.correctAnswer)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `correctAnswer must be one of the options for question ${q.id}`,
      path: ["correctAnswer"]
    });
  }
});

const CodingTestcaseSchema = z.object({
  input: z.string().min(0).max(20000),
  output: z.string().min(0).max(20000),
  isSample: z.boolean().default(false)
});

const LanguagesSchema = z.array(z.enum(["javascript", "python"])).min(1);

const StarterCodeSchema = z
  .object({
    javascript: z.string().optional(),
    python: z.string().optional()
  })
  .optional();

const CodingProblemSchema = z.object({
  id: z.string().min(1).max(30),
  title: z.string().min(3).max(200),
  statement: z.string().min(10).max(10000),
  inputFormat: z.string().max(2000).optional().default(""),
  outputFormat: z.string().max(2000).optional().default(""),
  constraints: z.string().max(2000).optional().default(""),
  languages: LanguagesSchema.default(["javascript", "python"]),
  starterCode: StarterCodeSchema,
  testcases: z.array(CodingTestcaseSchema).min(3, "At least 3 testcases required (2 sample + >=1 hidden)")
}).superRefine((p, ctx) => {
  // Enforce exactly 2 visible sample testcases
  const sampleCount = p.testcases.filter((t) => t.isSample === true).length;
  if (sampleCount !== 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Coding problem ${p.id} must have exactly 2 sample testcases (isSample:true). Found ${sampleCount}.`,
      path: ["testcases"]
    });
  }
});

const SectionSchema = z.object({
  sectionType: z.enum(["quiz", "coding"]),
  title: z.string().min(2).max(120),
  questions: z.array(QuizQuestionSchema).optional().default([]),
  problems: z.array(CodingProblemSchema).optional().default([])
}).superRefine((s, ctx) => {
  if (s.sectionType === "quiz" && s.questions.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quiz section must include at least 1 question",
      path: ["questions"]
    });
  }
  if (s.sectionType === "coding" && s.problems.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Coding section must include at least 1 problem",
      path: ["problems"]
    });
  }
});

const TestTemplateSchema = z.object({
  metadata: MetadataSchema,
  config: ConfigSchema.optional(),
  sections: z.array(SectionSchema).min(1, "At least 1 section required")
}).superRefine((t, ctx) => {
  // Ensure metadata.type matches section composition
  const hasQuiz = t.sections.some((s) => s.sectionType === "quiz");
  const hasCoding = t.sections.some((s) => s.sectionType === "coding");

  if (t.metadata.type === "quiz" && hasCoding) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "metadata.type is 'quiz' but coding section exists",
      path: ["metadata", "type"]
    });
  }
  if (t.metadata.type === "coding" && hasQuiz) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "metadata.type is 'coding' but quiz section exists",
      path: ["metadata", "type"]
    });
  }
  if (t.metadata.type === "mixed" && (!hasQuiz || !hasCoding)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "metadata.type is 'mixed' but missing quiz or coding section",
      path: ["metadata", "type"]
    });
  }
});

module.exports = { TestTemplateSchema };
