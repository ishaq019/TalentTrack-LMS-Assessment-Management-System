// server/api/index.js
// Vercel Serverless Function – wraps the Express app
const { app, connectDB } = require("../src/server");
const { seedTests } = require("../src/seed/seedTests");
const { ensureAdminUser } = require("../src/seed/seedAdmin");
const Test = require("../src/models/Test");

let seedPromise = null;

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      // 1) Default tests (only if collection empty)
      const count = await Test.countDocuments();
      if (count === 0) {
        console.log("[SEED] Test collection empty — seeding default tests...");
        const r = await seedTests();
        console.log(`[SEED] Seeded ${r.total} tests from ${r.bundles} bundles.`);
      } else {
        console.log(`[SEED] Found ${count} existing tests — skipping test auto-seed.`);
      }

      // 2) Admin user (idempotent — re-syncs role/verified/password every cold start)
      const a = await ensureAdminUser();
      console.log(`[SEED] Admin status: ${a.status}${a.email ? ` (${a.email})` : ""}`);
    } catch (e) {
      console.error("[SEED] Auto-seed failed:", e?.message || e);
      // Reset so a later cold start can retry
      seedPromise = null;
      throw e;
    }
  })();
  return seedPromise;
}

module.exports = async (req, res) => {
  await connectDB();
  // Best-effort seed; don't block requests if it fails
  ensureSeeded().catch(() => {});
  return app(req, res);
};
