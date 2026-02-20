// server/src/utils/tokens.js
const jwt = require("jsonwebtoken");

/**
 * Payload shape we put inside JWT.
 * Keep it minimal: never store passwords, OTPs, or sensitive user data in tokens.
 */
function buildPayload(user) {
  return {
    sub: String(user._id), // subject = userId
    role: user.role
  };
}

function getAccessConfig() {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  if (!secret) throw new Error("Missing JWT_ACCESS_SECRET");
  return { secret, expiresIn };
}

function getRefreshConfig() {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET");
  return { secret, expiresIn };
}

/**
 * Create access token (short-lived)
 */
function signAccessToken(user) {
  const { secret, expiresIn } = getAccessConfig();
  const payload = buildPayload(user);

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: "lms-portal",
    audience: "lms-client"
  });
}

/**
 * Create refresh token (long-lived)
 * Recommended: store a HASH of refresh token in DB for rotation/revocation (later file).
 */
function signRefreshToken(user) {
  const { secret, expiresIn } = getRefreshConfig();
  const payload = buildPayload(user);

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: "lms-portal",
    audience: "lms-client"
  });
}

/**
 * Verify access token and return decoded payload.
 * Throws if invalid/expired.
 */
function verifyAccessToken(token) {
  const { secret } = getAccessConfig();
  return jwt.verify(token, secret, {
    issuer: "lms-portal",
    audience: "lms-client"
  });
}

/**
 * Verify refresh token and return decoded payload.
 * Throws if invalid/expired.
 */
function verifyRefreshToken(token) {
  const { secret } = getRefreshConfig();
  return jwt.verify(token, secret, {
    issuer: "lms-portal",
    audience: "lms-client"
  });
}

/**
 * Helper: extract "Bearer <token>" from Authorization header.
 */
function extractBearerToken(req) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractBearerToken
};
