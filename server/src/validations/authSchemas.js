// server/src/validations/authSchemas.js
const { z } = require("zod");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format")
  .max(120, "Email too long");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long") // bcrypt input practical limit
  .refine((v) => /[A-Z]/.test(v), "Password must include at least 1 uppercase letter")
  .refine((v) => /[a-z]/.test(v), "Password must include at least 1 lowercase letter")
  .refine((v) => /[0-9]/.test(v), "Password must include at least 1 number");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name too short")
  .max(60, "Name too long");

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be a 6-digit number");

const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(72, "Password too long")
});

const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema
});

module.exports = {
  signupSchema,
  verifyOtpSchema,
  loginSchema,
  resetPasswordSchema
};
