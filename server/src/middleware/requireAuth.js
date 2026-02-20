// server/src/middleware/requireAuth.js
const { verifyAccessToken, extractBearerToken } = require("../utils/tokens");

/**
 * requireAuth
 * - Reads JWT access token from Authorization header
 * - Verifies it
 * - Attaches decoded payload to req.user
 *
 * Payload shape (from utils/tokens.js):
 *   { sub: "<userId>", role: "admin" | "user", iat, exp, iss, aud }
 */
function requireAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Missing access token. Use Authorization: Bearer <token>"
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Attach only what you need everywhere.
    req.user = {
      id: decoded.sub,
      role: decoded.role
    };

    return next();
  } catch (err) {
    // Token can be expired, malformed, or signed with wrong secret.
    return res.status(401).json({
      ok: false,
      error: "Invalid or expired access token"
    });
  }
}

module.exports = { requireAuth };
