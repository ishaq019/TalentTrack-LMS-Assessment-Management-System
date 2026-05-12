// server/src/seed/seedAdmin.js
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Idempotent: ensures an admin user exists matching ADMIN_EMAIL/ADMIN_PASSWORD.
 * - Creates the admin if missing.
 * - Promotes/repairs an existing user to role=admin, isVerified=true.
 * - Resets the password hash to match ADMIN_PASSWORD (so login is guaranteed to work).
 *
 * Returns { ok, status: "created"|"updated"|"unchanged"|"skipped", email? }.
 * Never throws on missing env — returns { ok:false, status:"skipped" } so callers can soft-fail.
 */
async function ensureAdminUser() {
  const adminEmailRaw = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "TalentTrack Admin";

  if (!adminEmailRaw || !adminPassword) {
    console.warn("[seedAdmin] Skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set");
    return { ok: false, status: "skipped" };
  }

  const adminEmail = String(adminEmailRaw).trim().toLowerCase();

  const existing = await User.findOne({ email: adminEmail }).select("+passwordHash");

  if (!existing) {
    const passwordHash = await User.hashPassword(adminPassword);
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
      isVerified: true
    });
    console.log(`[seedAdmin] Admin created: ${admin.email}`);
    return { ok: true, status: "created", email: admin.email };
  }

  // Idempotent repair: ensure role=admin, verified, and password matches env value.
  let changed = false;
  if (existing.role !== "admin") { existing.role = "admin"; changed = true; }
  if (!existing.isVerified) { existing.isVerified = true; changed = true; }
  if (adminName && existing.name !== adminName) { existing.name = adminName; changed = true; }

  // Always re-sync password hash so the env-declared password works.
  const passwordMatches = await existing.verifyPassword(adminPassword).catch(() => false);
  if (!passwordMatches) {
    existing.passwordHash = await User.hashPassword(adminPassword);
    changed = true;
  }

  if (changed) {
    await existing.save();
    console.log(`[seedAdmin] Admin updated: ${existing.email}`);
    return { ok: true, status: "updated", email: existing.email };
  }

  console.log(`[seedAdmin] Admin already up-to-date: ${existing.email}`);
  return { ok: true, status: "unchanged", email: existing.email };
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("[seedAdmin] Missing MONGO_URI in .env");
    process.exit(1);
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("[seedAdmin] Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env");
    console.error("Add these to .env then re-run.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { autoIndex: true });
  console.log("[seedAdmin] Connected to MongoDB");

  await ensureAdminUser();

  await mongoose.disconnect();
  console.log("[seedAdmin] Done.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error("[seedAdmin] Fatal:", e);
    process.exit(1);
  });
}

module.exports = { ensureAdminUser };
