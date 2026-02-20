// server/src/models/Assignment.js
const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Admin sets when assigning
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    // Status flow
    // assigned -> in_progress -> submitted
    // OR assigned -> expired
    status: {
      type: String,
      enum: ["assigned", "in_progress", "submitted", "expired"],
      default: "assigned",
      index: true
    },

    // Optional: allow limited attempts
    attemptLimit: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },

    // Admin can override test config at assignment time
    overrideConfig: {
      durationMinutes: { type: Number, min: 1, max: 300, default: null },
      questionCount: { type: Number, min: 1, max: 500, default: null }
    },

    // Timestamps for user behavior tracking
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

/**
 * Useful compound index for dashboards:
 * - quickly fetch latest assignments by student + status
 */
AssignmentSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Assignment", AssignmentSchema);
