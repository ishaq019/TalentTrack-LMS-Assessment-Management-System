// server/src/controllers/authController.js
const User = require("../models/User");
const { signupSchema, verifyOtpSchema, loginSchema } = require("../validations/authSchemas");
const { createAndSendOtp, verifyOtp } = require("../services/otpService");
const { signAccessToken, signRefreshToken } = require("../utils/tokens");

/**
 * POST /auth/signup
 * Body: { name, email, password }
 *
 * Behavior:
 * - Creates user if not exists
 * - If exists but not verified: re-send OTP
 * - If exists and verified: block signup (use login)
 */
async function signup(req, res, next) {
  try {
    const { name, email, password } = signupSchema.parse(req.body);

    const existing = await User.findOne({ email });

    if (existing && existing.isVerified) {
      return res.status(409).json({ ok: false, error: "Account already exists. Please login." });
    }

    if (!existing) {
      const passwordHash = await User.hashPassword(password);

      await User.create({
        name,
        email,
        passwordHash,
        role: "user",
        isVerified: false
      });
    } else {
      // User exists but not verified:
      // Optionally update name/password if you want. For now keep it simple.
    }

    await createAndSendOtp(email);

    return res.status(201).json({
      ok: true,
      message: "OTP sent to email. Please verify to activate your TalentTrack account."
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 *
 * Behavior:
 * - Verifies OTP record
 * - Marks user as verified
 */
async function verifyOtpController(req, res, next) {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const result = await verifyOtp({ email, otp });
    if (!result.ok) {
      return res.status(400).json(result);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }

    user.isVerified = true;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      ok: true,
      message: "Email verified successfully.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 *
 * Behavior:
 * - Requires verified user
 * - Returns accessToken + refreshToken
 */
async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ ok: false, error: "Email not verified. Please verify OTP first." });
    }

    const ok = await user.verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid credentials." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      ok: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/resend-otp
 * Body: { email }
 *
 * Behavior:
 * - Re-sends OTP for an unverified user
 */
async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ ok: false, error: "No account found with that email." });
    }

    if (user.isVerified) {
      return res.status(409).json({ ok: false, error: "Account is already verified. Please login." });
    }

    await createAndSendOtp(email.trim().toLowerCase());

    return res.json({ ok: true, message: "OTP re-sent to your email." });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/refresh
 * Body: { refreshToken }
 *
 * Behavior:
 * - Verifies the refresh token
 * - Returns a new access token (and optionally a rotated refresh token)
 */
async function refreshTokens(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ ok: false, error: "refreshToken is required." });
    }

    const { verifyRefreshToken } = require("../utils/tokens");
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ ok: false, error: "Invalid or expired refresh token." });
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isVerified) {
      return res.status(401).json({ ok: false, error: "User not found or not verified." });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    return res.json({
      ok: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/forgot-password
 * Body: { email }
 *
 * Behavior:
 * - Sends an OTP to a verified user's email for password reset
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required." });
    }

    const normalised = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalised });

    if (!user) {
      // Don't reveal whether the email exists — always return success-like message
      return res.json({ ok: true, message: "If this email is registered, a reset OTP has been sent." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ ok: false, error: "Account is not verified. Please complete signup first." });
    }

    await createAndSendOtp(normalised);

    return res.json({ ok: true, message: "If this email is registered, a reset OTP has been sent." });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/reset-password
 * Body: { email, otp, newPassword }
 *
 * Behavior:
 * - Verifies OTP
 * - Updates user's password hash
 */
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ ok: false, error: "email, otp, and newPassword are all required." });
    }

    const { resetPasswordSchema } = require("../validations/authSchemas");
    const parsed = resetPasswordSchema.parse({ email, otp, newPassword });

    // Verify OTP
    const result = await verifyOtp({ email: parsed.email, otp: parsed.otp });
    if (!result.ok) {
      return res.status(400).json(result);
    }

    const user = await User.findOne({ email: parsed.email }).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }

    user.passwordHash = await User.hashPassword(parsed.newPassword);
    await user.save();

    return res.json({ ok: true, message: "Password has been reset successfully. Please login with your new password." });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  verifyOtpController,
  login,
  resendOtp,
  refreshTokens,
  forgotPassword,
  resetPassword
};
