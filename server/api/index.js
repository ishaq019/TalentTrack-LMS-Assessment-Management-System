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

// Routes that must work even when MongoDB is unreachable / misconfigured.
// Without this, a bad MONGO_URI turns every URL (including / and /favicon.ico)
// into a 500 with a leaked stack trace.
const DB_LESS_PATHS = new Set(["/", "/favicon.ico", "/favicon.png", "/health", "/robots.txt"]);

module.exports = async (req, res) => {
  const url = (req.url || "/").split("?")[0];

  // Friendly root response — no DB needed.
  if (req.method === "GET" && url === "/") {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      brand: "TalentTrack",
      service: "lms-assessment-backend",
      message: "API is running. See /health.",
      time: new Date().toISOString()
    }));
  }

  // Silently 204 these – browsers request favicons against the API origin.
  if (req.method === "GET" && (url === "/favicon.ico" || url === "/favicon.png" || url === "/robots.txt")) {
    res.statusCode = 204;
    return res.end();
  }

  // /health works without DB so platform health checks still pass during DB outages.
  if (DB_LESS_PATHS.has(url)) {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (e) {
    console.error("[DB] Unavailable for request:", req.method, url, "-", e?.message || e);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 503;
    return res.end(JSON.stringify({
      ok: false,
      error: "Database unavailable. Check MONGO_URI configuration.",
      // Surface a concise reason in non-production for easier debugging.
      reason: process.env.NODE_ENV === "production" ? undefined : (e?.message || String(e))
    }));
  }

  // Best-effort seed; don't block requests if it fails
  ensureSeeded().catch(() => {});
  return app(req, res);
};
