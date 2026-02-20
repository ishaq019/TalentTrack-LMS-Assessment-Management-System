// client/src/utils/validators.js
export function isEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return e.includes("@") && e.includes(".");
}

export function passwordPolicy(password) {
  const p = String(password || "");
  if (p.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(p)) return "Add at least 1 uppercase letter.";
  if (!/[0-9]/.test(p)) return "Add at least 1 number.";
  return null; // ok
}

export function isOtp(otp) {
  return /^[0-9]{4,8}$/.test(String(otp || "").trim());
}
