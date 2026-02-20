// server/src/services/codeRunnerClient.js
// Calls the external TalentTrack Runner service (Docker-hosted)
// Runner API: POST {RUNNER_BASE_URL}/run with header X-RUNNER-SECRET

async function runCodeOnRunner({ language, sourceCode, testcases }) {
  const baseUrl = process.env.RUNNER_BASE_URL;
  const secret = process.env.RUNNER_SECRET;

  if (!baseUrl) throw new Error("Missing RUNNER_BASE_URL in env");
  if (!secret) throw new Error("Missing RUNNER_SECRET in env");

  if (!["javascript", "python"].includes(language)) {
    throw new Error("Unsupported language");
  }
  if (!sourceCode || typeof sourceCode !== "string") {
    throw new Error("sourceCode is required");
  }
  if (!Array.isArray(testcases) || testcases.length === 0) {
    throw new Error("testcases[] is required");
  }

  // Hard caps from backend side too (defense in depth)
  const timeoutMs = Number(process.env.RUNNER_TIMEOUT_MS || 2000);
  const maxOutputChars = Number(process.env.RUNNER_MAX_OUTPUT_CHARS || 20000);

  const url = `${baseUrl.replace(/\/$/, "")}/run`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RUNNER-SECRET": secret
    },
    body: JSON.stringify({
      language,
      sourceCode,
      testcases,
      timeoutMs,
      maxOutputChars
    })
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || `Runner failed with status ${resp.status}`;
    throw new Error(msg);
  }

  if (!data || data.ok !== true || !Array.isArray(data.results)) {
    throw new Error("Invalid runner response");
  }

  return data.results;
}

module.exports = { runCodeOnRunner };
