// server/src/jobs/initJobs.js
const cron = require("node-cron");
const { runExpiryJob } = require("./expiryJob");
const { runMonthlyReportJobForCurrentUTCMonth } = require("./monthlyReportJob");

/**
 * Initialize scheduled jobs
 * - expiry check: every minute
 * - monthly report recompute: daily at 00:10 UTC
 */
function initJobs() {
  // Every 1 minute
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const r = await runExpiryJob();
        if (r.modified > 0) {
          console.log(`[JOBS][expiry] expired updated: ${r.modified}`);
        }
      } catch (e) {
        console.error("[JOBS][expiry] error:", e?.message || e);
      }
    },
    { timezone: "UTC" }
  );

  // Daily at 00:10 UTC (keeps current month report fresh)
  cron.schedule(
    "10 0 * * *",
    async () => {
      try {
        const r = await runMonthlyReportJobForCurrentUTCMonth();
        console.log(`[JOBS][monthly] month=${r.month} usersUpdated=${r.usersUpdated}`);
      } catch (e) {
        console.error("[JOBS][monthly] error:", e?.message || e);
      }
    },
    { timezone: "UTC" }
  );

  console.log("[JOBS] initJobs scheduled: expiry (every minute), monthly (daily 00:10 UTC)");
}

module.exports = { initJobs };
