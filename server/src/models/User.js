// server/src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 60,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
      maxlength: 120
    },
    passwordHash: {
      type: String,
      required: true,
      select: false // IMPORTANT: never include in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

/**
 * Password hashing helpers
 * - We store ONLY passwordHash.
 * - We never store plain password.
 */
UserSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
  return bcrypt.hash(plainPassword, rounds);
};

UserSchema.methods.verifyPassword = async function verifyPassword(plainPassword) {
  // passwordHash is select:false by default; ensure you queried it with +passwordHash when needed
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Safe output: remove sensitive fields when converting to JSON
 */
UserSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  return obj;
};

/**
 * Indexes (speed + uniqueness)
 * unique: true creates an index, but defining it explicitly is clearer.
 */
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
