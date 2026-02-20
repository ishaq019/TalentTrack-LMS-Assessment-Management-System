// server/src/services/codingEvaluationService.js
const { runCodeOnRunner } = require("./codeRunnerClient");

/**
 * Extract coding problems (with testcases) from a Test doc.
 */
function getCodingProblems(testDoc) {
  const problems = [];
  for (const section of testDoc.sections || []) {
    if (section.sectionType !== "coding") continue;
    for (const p of section.problems || []) problems.push(p);
  }
  return problems;
}

/**
 * Evaluate coding submissions.
 *
 * @param {Object} params
 * @param {Object} params.testDoc - full Test document (must include testcases)
 * @param {Array} params.codingSubmissions - [{problemId, language, sourceCode}]
 * @returns {Object} { codingResults, codingScore, codingMaxScore, breakdown }
 */
async function evaluateCoding({ testDoc, codingSubmissions }) {
  const scorePerTestcase = Number(testDoc.config?.scorePerTestcase || 10);

  const problems = getCodingProblems(testDoc);
  const subIndex = new Map(
    (codingSubmissions || []).map((s) => [String(s.problemId), s])
  );

  let totalCases = 0;
  let totalPassed = 0;

  const codingResults = [];

  for (const p of problems) {
    const submission = subIndex.get(String(p.id));

    // If student didn't submit code for this problem: mark as 0 score
    if (!submission) {
      const allCases = p.testcases || [];
      const hiddenCount = allCases.filter((t) => !t.isSample).length;
      totalCases += allCases.length;

      codingResults.push({
        problemId: p.id,
        language: "javascript", // default placeholder
        sourceCode: "",
        sampleResults: (allCases.filter((t) => t.isSample) || []).map((tc) => ({
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: "",
          passed: false,
          runtimeMs: null,
          error: "No submission"
        })),
        hiddenSummary: { total: hiddenCount, passed: 0 }
      });
      continue;
    }

    const language = submission.language;
    const sourceCode = submission.sourceCode;

    // Validate language allowed by problem
    const allowed = p.languages || ["javascript", "python"];
    if (!allowed.includes(language)) {
      const allCases = p.testcases || [];
      const hiddenCount = allCases.filter((t) => !t.isSample).length;
      totalCases += allCases.length;

      codingResults.push({
        problemId: p.id,
        language,
        sourceCode,
        sampleResults: (allCases.filter((t) => t.isSample) || []).map((tc) => ({
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: "",
          passed: false,
          runtimeMs: null,
          error: `Language not allowed. Allowed: ${allowed.join(", ")}`
        })),
        hiddenSummary: { total: hiddenCount, passed: 0 }
      });
      continue;
    }

    const allTestcases = p.testcases || [];
    const sample = allTestcases.filter((t) => t.isSample === true);
    const hidden = allTestcases.filter((t) => t.isSample !== true);

    // Evaluate sample first (these are visible)
    const sampleRun = await runCodeOnRunner({
      language,
      sourceCode,
      testcases: sample.map((t) => ({ input: t.input, output: t.output }))
    });

    const sampleResults = sample.map((tc, idx) => ({
      input: tc.input,
      expectedOutput: tc.output,
      actualOutput: sampleRun[idx]?.actualOutput ?? "",
      passed: Boolean(sampleRun[idx]?.passed),
      runtimeMs: sampleRun[idx]?.runtimeMs ?? null,
      error: sampleRun[idx]?.error ?? ""
    }));

    // Evaluate hidden (store only summary)
    let hiddenPassed = 0;
    if (hidden.length > 0) {
      const hiddenRun = await runCodeOnRunner({
        language,
        sourceCode,
        testcases: hidden.map((t) => ({ input: t.input, output: t.output }))
      });

      hiddenPassed = hiddenRun.reduce((acc, r) => acc + (r?.passed ? 1 : 0), 0);
      totalPassed += hiddenPassed; // count hidden passed
    }

    // Count all cases passed:
    const samplePassed = sampleResults.reduce((acc, r) => acc + (r.passed ? 1 : 0), 0);
    totalPassed += samplePassed;

    totalCases += allTestcases.length;

    codingResults.push({
      problemId: p.id,
      language,
      sourceCode,
      sampleResults,
      hiddenSummary: { total: hidden.length, passed: hiddenPassed }
    });
  }

  const codingScore = totalPassed * scorePerTestcase;
  const codingMaxScore = totalCases * scorePerTestcase;

  return {
    codingResults,
    codingScore,
    codingMaxScore,
    breakdown: {
      codingPassedHidden: codingResults.reduce((sum, r) => sum + (r.hiddenSummary?.passed || 0), 0),
      codingTotalHidden: codingResults.reduce((sum, r) => sum + (r.hiddenSummary?.total || 0), 0)
    }
  };
}

module.exports = { evaluateCoding };
