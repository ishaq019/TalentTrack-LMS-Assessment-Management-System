// server/src/services/scoringService.js
/**
 * TalentTrack Scoring Service (Quiz + Coding)
 *
 * - Quiz: exact match with correctAnswer
 * - Coding: evaluated through external Runner service (JS/Python)
 *   - Sample testcases: detailed results
 *   - Hidden testcases: only counts (no leakage)
 */

const { evaluateCoding } = require("./codingEvaluationService");

function indexQuizQuestions(testDoc) {
  const map = new Map(); // questionId -> { correctAnswer }
  for (const section of testDoc.sections || []) {
    if (section.sectionType !== "quiz") continue;
    for (const q of section.questions || []) {
      map.set(q.id, { correctAnswer: q.correctAnswer });
    }
  }
  return map;
}

function scoreQuiz({ testDoc, quizAnswers, negativeMarking = 0 }) {
  const qIndex = indexQuizQuestions(testDoc);

  let correct = 0;
  let wrong = 0;

  for (const ans of quizAnswers || []) {
    const q = qIndex.get(ans.questionId);
    if (!q) continue;
    if (ans.selectedOption === q.correctAnswer) correct += 1;
    else wrong += 1;
  }

  const total = qIndex.size;
  const maxScore = total; // 1 point per question (MVP)
  const score = Math.max(0, correct - wrong * negativeMarking);

  return { score, maxScore, correct, total };
}

/**
 * Main scoring for a submission.
 * @returns scoring output including codingResults (safe)
 */
async function scoreSubmission({ testDoc, quizAnswers, codingSubmissions }) {
  const negativeMarking = Number(testDoc.config?.negativeMarking || 0);

  // 1) Quiz scoring
  const quiz = scoreQuiz({ testDoc, quizAnswers, negativeMarking });

  // 2) Coding evaluation (Runner)
  const codingEval = await evaluateCoding({
    testDoc,
    codingSubmissions: codingSubmissions || []
  });

  const score = quiz.score + codingEval.codingScore;
  const maxScore = quiz.maxScore + codingEval.codingMaxScore;

  return {
    score,
    maxScore,
    sectionScores: {
      quiz: quiz.score,
      coding: codingEval.codingScore
    },
    breakdown: {
      quizCorrect: quiz.correct,
      quizTotal: quiz.total,
      codingPassedHidden: codingEval.breakdown.codingPassedHidden,
      codingTotalHidden: codingEval.breakdown.codingTotalHidden
    },
    codingResults: codingEval.codingResults,
    scoringMode: "quiz_and_coding_runner"
  };
}

module.exports = {
  scoreQuiz,
  scoreSubmission
};
