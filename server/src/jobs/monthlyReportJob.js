// server/src/jobs/monthlyReportJob.js
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

/**
 * Build month range [start, end)
 * @param {number} year e.g. 2026
 * @param {number} month 1-12
 */
function getMonthRangeUTC(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

function monthKey(year, month) {
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}`; // "2026-02"
}

/**
 * Runs monthly report generation for a specific month.
 * Writes results into MongoDB collection: monthly_reports
 *
 * Schema (stored):
 * {
 *   userId: ObjectId,
 *   month: "YYYY-MM",
 *   assignedCount: number,
 *   submittedCount: number,
 *   avgScore: number,
 *   totalScore: number,
 *   totalMaxScore: number,
 *   updatedAt: Date
 * }
 */
async function runMonthlyReportJob({ year, month }) {
  const { start, end } = getMonthRangeUTC(year, month);
  const mKey = monthKey(year, month);

  // 1) Assigned count per user (Assignments created during month)
  const assignedAgg = await Assignment.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$assignedTo", assignedCount: { $sum: 1 } } }
  ]);

  // 2) Submitted count per user (Assignments submitted during month)
  const submittedAgg = await Assignment.aggregate([
    { $match: { submittedAt: { $gte: start, $lt: end }, status: "submitted" } },
    { $group: { _id: "$assignedTo", submittedCount: { $sum: 1 } } }
  ]);

  // 3) Score stats per user (Submissions submitted during month)
  const scoreAgg = await Submission.aggregate([
    { $match: { submittedAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: "$userId",
        totalScore: { $sum: "$score" },
        totalMaxScore: { $sum: "$maxScore" },
        submissionsWithScore: { $sum: 1 }
      }
    },
    {
      $addFields: {
        avgScore: {
          $cond: [
            { $gt: ["$submissionsWithScore", 0] },
            { $divide: ["$totalScore", "$submissionsWithScore"] },
            0
          ]
        }
      }
    }
  ]);

  // Merge stats by userId
  const byUser = new Map(); // userIdStr -> report

  for (const row of assignedAgg) {
    byUser.set(String(row._id), {
      userId: row._id,
      month: mKey,
      assignedCount: row.assignedCount,
      submittedCount: 0,
      totalScore: 0,
      totalMaxScore: 0,
      avgScore: 0,
      updatedAt: new Date()
    });
  }

  for (const row of submittedAgg) {
    const key = String(row._id);
    const existing =
      byUser.get(key) ||
      ({
        userId: row._id,
        month: mKey,
        assignedCount: 0,
        submittedCount: 0,
        totalScore: 0,
        totalMaxScore: 0,
        avgScore: 0,
        updatedAt: new Date()
      });
    existing.submittedCount = row.submittedCount;
    existing.updatedAt = new Date();
    byUser.set(key, existing);
  }

  for (const row of scoreAgg) {
    const key = String(row._id);
    const existing =
      byUser.get(key) ||
      ({
        userId: row._id,
        month: mKey,
        assignedCount: 0,
        submittedCount: 0,
        totalScore: 0,
        totalMaxScore: 0,
        avgScore: 0,
        updatedAt: new Date()
      });
    existing.totalScore = row.totalScore || 0;
    existing.totalMaxScore = row.totalMaxScore || 0;
    existing.avgScore = Number(row.avgScore || 0);
    existing.updatedAt = new Date();
    byUser.set(key, existing);
  }

  // Upsert into MongoDB collection (no model needed)
  const coll = mongoose.connection.collection("monthly_reports");

  const ops = Array.from(byUser.values()).map((doc) => ({
    updateOne: {
      filter: { userId: doc.userId, month: doc.month },
      update: { $set: doc },
      upsert: true
    }
  }));

  if (ops.length > 0) {
    await coll.bulkWrite(ops, { ordered: false });
  }

  return {
    ok: true,
    month: mKey,
    usersUpdated: ops.length,
    rangeUTC: { start: start.toISOString(), end: end.toISOString() }
  };
}

/**
 * Convenience: run for current UTC month
 */
async function runMonthlyReportJobForCurrentUTCMonth() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  return runMonthlyReportJob({ year, month });
}

module.exports = {
  runMonthlyReportJob,
  runMonthlyReportJobForCurrentUTCMonth
};
