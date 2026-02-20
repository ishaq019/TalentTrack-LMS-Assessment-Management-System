// server/src/models/OtpVerification.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const OtpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      maxlength: 120,
      index: true
    },

    // Store only a hash of the OTP (never store the OTP itself)
    otpHash: {
      type: String,
      required: true,
      select: false
    },

    // OTP expiry time
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    // Brute-force protection
    attempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

/**
 * TTL index:
 * MongoDB automatically deletes documents after expiresAt time.
 * This avoids extra cleanup jobs and avoids Redis.
 */
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Helpers to hash and compare OTP
 * OTP is short, but still must be hashed because DB might be leaked.
 */
OtpVerificationSchema.statics.hashOtp = async function hashOtp(plainOtp) {
  // Lower rounds because OTP is short-lived; still hashed.
  const rounds = Number(process.env.OTP_BCRYPT_ROUNDS || 8);
  return bcrypt.hash(String(plainOtp), rounds);
};

OtpVerificationSchema.methods.verifyOtp = async function verifyOtp(plainOtp) {
  // otpHash is select:false by default, must be selected explicitly
  return bcrypt.compare(String(plainOtp), this.otpHash);
};

/**
 * Can user still attempt?
 */
OtpVerificationSchema.methods.canAttempt = function canAttempt() {
  const max = Number(process.env.OTP_MAX_ATTEMPTS || 5);
  return this.attempts < max;
};

module.exports = mongoose.model("OtpVerification", OtpVerificationSchema);
