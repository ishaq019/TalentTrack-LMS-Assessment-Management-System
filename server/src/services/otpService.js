// server/src/services/otpService.js
const OtpVerification = require("../models/OtpVerification");
const { sendMail, wrapHtml } = require("../config/mailer");

/**
 * Generate a 6-digit numeric OTP.
 * Using crypto is better, but this is acceptable for OTP if rate-limited + short expiry.
 */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 100000-999999
}

function getOtpExpiryDate() {
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES || 10);
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function sendOtpEmail({ email, otp }) {
  const subject = "TalentTrack OTP Verification";
  const bodyHtml = `
    <p>Use the OTP below to verify your TalentTrack account:</p>
    <div style="margin:16px 0;padding:14px 16px;border:1px dashed #d1d5db;border-radius:10px;display:inline-block;">
      <div style="font-size:22px;font-weight:700;letter-spacing:3px;">${otp}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes</div>
    </div>
    <p style="margin-top:16px;">If you didn’t request this, ignore this email.</p>
  `;
  const html = wrapHtml({ title: "Verify your email", bodyHtml });

  return sendMail({
    to: email,
    subject,
    text: `TalentTrack OTP: ${otp} (valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes)`,
    html
  });
}

/**
 * Create or replace OTP record for an email.
 * Policy: One active OTP per email (new request invalidates old one).
 */
async function createAndSendOtp(email) {
  const otp = generateOtp();
  const otpHash = await OtpVerification.hashOtp(otp);
  const expiresAt = getOtpExpiryDate();

  await OtpVerification.findOneAndUpdate(
    { email },
    { email, otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  await sendOtpEmail({ email, otp });

  return { ok: true };
}

/**
 * Verify OTP for email.
 * - checks record exists
 * - checks expiry
 * - checks attempts limit
 * - compares OTP hash
 * - increments attempts on failure
 * - deletes record on success
 */
async function verifyOtp({ email, otp }) {
  const record = await OtpVerification.findOne({ email }).select("+otpHash");

  if (!record) {
    return { ok: false, error: "OTP not found or already used. Please request a new OTP." };
  }

  if (new Date() > record.expiresAt) {
    // expired; remove record
    await OtpVerification.deleteOne({ _id: record._id });
    return { ok: false, error: "OTP expired. Please request a new OTP." };
  }

  if (!record.canAttempt()) {
    return { ok: false, error: "Too many OTP attempts. Please request a new OTP." };
  }

  const isValid = await record.verifyOtp(otp);

  if (!isValid) {
    record.attempts += 1;
    await record.save();
    return { ok: false, error: "Invalid OTP." };
  }

  // Success: delete OTP record so it can't be reused
  await OtpVerification.deleteOne({ _id: record._id });
  return { ok: true };
}

module.exports = {
  createAndSendOtp,
  verifyOtp
};
