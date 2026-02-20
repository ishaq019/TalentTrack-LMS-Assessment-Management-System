// server/src/jobs/expiryJob.js
const Assignment = require("../models/Assignment");

/**
 * Expire assignments that passed expiresAt and are not submitted.
 * Status transitions:
 * - assigned -> expired
 * - in_progress -> expired
 * (submitted remains submitted)
 */
async function runExpiryJob() {
  const now = new Date();

  const result = await Assignment.updateMany(
    {
      expiresAt: { $lte: now },
      status: { $in: ["assigned", "in_progress"] }
    },
    {
      $set: { status: "expired" }
    }
  );

  return {
    ok: true,
    matched: result.matchedCount ?? result.n ?? 0,
    modified: result.modifiedCount ?? result.nModified ?? 0
  };
}

module.exports = { runExpiryJob };
