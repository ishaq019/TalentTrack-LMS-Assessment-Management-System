// server/src/seed/seedAdmin.js
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("[seedAdmin] Missing MONGO_URI in .env");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "TalentTrack Admin";

  if (!adminEmail || !adminPassword) {
    console.error("[seedAdmin] Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env");
    console.error("Add these to .env then re-run.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { autoIndex: true });
  console.log("[seedAdmin] Connected to MongoDB");

  const existing = await User.findOne({ email: adminEmail }).select("+passwordHash");

  if (!existing) {
    const passwordHash = await User.hashPassword(adminPassword);

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
      isVerified: true // admin should be verified by default
    });

    console.log("[seedAdmin] Admin created:", {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role
    });
  } else {
    // Update existing user to admin + verified + update password
    existing.role = "admin";
    existing.isVerified = true;
    existing.passwordHash = await User.hashPassword(adminPassword);
    if (adminName) existing.name = adminName;

    await existing.save();

    console.log("[seedAdmin] Admin updated:", {
      id: existing._id.toString(),
      email: existing.email,
      role: existing.role
    });
  }

  await mongoose.disconnect();
  console.log("[seedAdmin] Done.");
}

main().catch((e) => {
  console.error("[seedAdmin] Fatal:", e);
  process.exit(1);
});
