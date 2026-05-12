// server/src/server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

dotenv.config();

// Define NODE_ENV early for mongodb-memory-server check
const NODE_ENV = process.env.NODE_ENV || "development";

// Development: mongodb-memory-server fallback
let mongoMemoryServer;
const MongoMemoryServer = NODE_ENV === "development" ? require("mongodb-memory-server").MongoMemoryServer : null;

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const { initJobs } = require("./jobs/initJobs");
const { seedTests } = require("./seed/seedTests");
const { ensureAdminUser } = require("./seed/seedAdmin");

const app = express();

/**
 * 1) Environment validation (fail fast)
 */
const REQUIRED_ENVS = [
  "MONGO_URI", 
  "JWT_ACCESS_SECRET"
];

// Only validate on startup (not on Vercel's build phase)
if (process.env.VERCEL !== "1" || process.env.VERCEL_ENV) {
  for (const key of REQUIRED_ENVS) {
    if (!process.env[key]) {
      console.error(`[ENV ERROR] Missing required env: ${key}`);
      if (process.env.VERCEL !== "1") {
        process.exit(1);
      }
    }
  }
}

const PORT = process.env.PORT || 8080;

/**
 * 2) CORS – allowed origins
 */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL, // Add your deployed frontend URL in Vercel env vars
  "https://syedishaq.me",
  "https://www.syedishaq.me",
].filter(Boolean); // Remove undefined values

// Allow any *.github.io subdomain or *.vercel.app
function isAllowedOrigin(origin) {
  if (!origin) return true; // allow server-to-server / Postman
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/[\w-]+\.github\.io$/i.test(origin)) return true;
  if (/^https:\/\/[\w-]+\.vercel\.app$/i.test(origin)) return true; // Allow Vercel preview URLs
  return false;
}

/**
 * 2) Security + core middleware
 */
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (NODE_ENV !== "test") {
  app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/**
 * 3) Rate limiting
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { ok: false, error: "Too many auth attempts. Try again later." }
});

/**
 * 4) Health
 */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    brand: "TalentTrack",
    service: "lms-assessment-backend",
    env: NODE_ENV,
    time: new Date().toISOString()
  });
});

/**
 * 5) Routes
 */
app.use("/auth", authLimiter, authRoutes);
app.use("/admin", adminRoutes);
app.use("/me", userRoutes);

/**
 * 6) 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route not found" });
});

/**
 * 7) Central error handler
 */
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);

  if (err?.name === "ZodError") {
    return res.status(400).json({
      ok: false,
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message }))
    });
  }

  const status = err.statusCode || 500;
  return res.status(status).json({
    ok: false,
    error: err.message || "Internal Server Error"
  });
});

/**
 * 8) DB connect helper (called once per cold start on Vercel)
 * In development: Falls back to mongodb-memory-server if Atlas is unreachable
 */
let dbConnected = false;

async function connectDB() {
  if (dbConnected) return;
  mongoose.set("strictQuery", true);
  
  try {
    // Try to connect to configured MongoDB URI
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: NODE_ENV !== "production",
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    dbConnected = true;
    console.log("[DB] ✅ Connected to MongoDB Atlas");
  } catch (atlasError) {
    // In development, fall back to in-memory MongoDB
    if (NODE_ENV === "development" && MongoMemoryServer) {
      console.warn("[DB] ⚠️  MongoDB Atlas unreachable, falling back to in-memory MongoDB...");
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        const mongoUri = mongoMemoryServer.getUri();
        
        await mongoose.connect(mongoUri, {
          autoIndex: true
        });
        dbConnected = true;
        console.log("[DB] ✅ Connected to in-memory MongoDB (development only)");
      } catch (memoryError) {
        console.error("[DB] ❌ Failed to initialize in-memory MongoDB:", memoryError.message);
        throw memoryError;
      }
    } else {
      // In production or without fallback, throw the original error
      console.error("[DB] ❌ Failed to connect to MongoDB:", atlasError.message);
      throw atlasError;
    }
  }
}

/**
 * 9) Local dev: start server + cron jobs
 *    Vercel: just export app (connection handled per-request)
 */
if (process.env.VERCEL !== "1") {
  (async function start() {
    try {
      await connectDB();
      await seedTests();
      await ensureAdminUser().catch((e) => {
        console.warn("[seedAdmin] Auto-seed failed:", e?.message || e);
      });

      const jobsEnabled = process.env.JOBS_ENABLED !== "false";
      if (jobsEnabled) {
        initJobs();
      } else {
        console.log("[JOBS] Disabled via JOBS_ENABLED=false");
      }

      app.listen(PORT, () => {
        console.log(`[TalentTrack] API running on http://localhost:${PORT}`);
      });
    } catch (e) {
      console.error("[STARTUP ERROR]", e);
      process.exit(1);
    }
  })();
}

// Graceful shutdown: clean up in-memory MongoDB
process.on("SIGTERM", async () => {
  console.log("[SHUTDOWN] Received SIGTERM, cleaning up...");
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    console.log("[SHUTDOWN] In-memory MongoDB stopped");
  }
  process.exit(0);
});

// Export for Vercel serverless + connectDB for the handler
module.exports = { app, connectDB };
