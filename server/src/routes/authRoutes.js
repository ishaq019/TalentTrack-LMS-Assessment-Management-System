// server/src/routes/authRoutes.js
const express = require("express");
const { signup, verifyOtpController, login, resendOtp, refreshTokens, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

/**
 * TalentTrack Auth Routes
 * Base path: /auth
 */

// Signup -> send OTP
router.post("/signup", signup);

// Verify OTP -> activate account + return tokens
router.post("/verify-otp", verifyOtpController);

// Resend OTP for unverified accounts
router.post("/resend-otp", resendOtp);

// Login -> return access + refresh tokens
router.post("/login", login);

// Refresh -> rotate tokens
router.post("/refresh", refreshTokens);

// Forgot password -> send reset OTP
router.post("/forgot-password", forgotPassword);

// Reset password -> verify OTP + update password
router.post("/reset-password", resetPassword);

module.exports = router;
