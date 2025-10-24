const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");
const config = require("./src/config/environment");
const authRoutes = require("./src/api/routes/auth.routes");
const userRoutes = require("./src/api/routes/user.routes");
const kycRoutes = require("./src/api/routes/kyc.routes");

const app = express();

// --- Error Handling for Robustness ---
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.stack || err);
  // It's safer to exit after an uncaught exception, as the application state might be corrupted.
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "❌ Unhandled Rejection at:",
    promise,
    "reason:",
    reason.stack || reason
  );
});

// --- Security and Middleware Setup ---
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cookieParser());

// --- CORS Configuration ---
const whitelist = (process.env.ALLOWED_ORIGINS || "").split(",");

if (whitelist.length === 1 && whitelist[0] === "") {
  console.warn(
    "⚠️ No CORS origins whitelisted. Set ALLOWED_ORIGINS in your .env file."
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ Request from origin ${origin} blocked by CORS`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,OPTIONS",
  credentials: true,
  allowedHeaders: "Content-Type,Authorization,X-CSRF-Token",
};
app.use(cors(corsOptions));

// --- Custom CORS Error Handler ---
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    console.error("CORS error caught and handled:", err.message);
    res
      .status(403)
      .json({ error: "Forbidden: This origin is not whitelisted." });
  } else {
    next(err);
  }
});

// --- Body Parser and Sanitization ---
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// --- NEW: REQUEST temporary MIDDLEWARE ---
// This will run for every request and log its details to the console.
const requestLogger = (req, res, next) => {
  console.log("--- New Request ---");
  console.log(`Method: ${req.method} | URL: ${req.originalUrl}`);

  if (req.body && Object.keys(req.body).length > 0) {
    const bodyToLog = { ...req.body };

    // Redact sensitive fields to prevent them from being logged
    const sensitiveKeys = ['password', 'recaptchaToken', 'token', 'secret', 'apiKey', 'sessionKey', 'authorization', 'extended_fields'];
    for (const key of sensitiveKeys) {
      if (bodyToLog[key]) {
        bodyToLog[key] = '[REDACTED]';
      }
    }
    
    console.log("Request Body:", JSON.stringify(bodyToLog));
  }
  
  next();
};
app.use(requestLogger);
// --- END OF temporary MIDDLEWARE ---

// --- Custom Headers and Cache Control ---
app.use((_, res, next) => {
  res.set({ "Cache-Control": "no-store" });
  next();
});

// --- JSON Parsing Error Handler ---
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error(`Invalid JSON received: ${err.message}`);
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  next();
});

// 1. Serve static files from the 'dist' folder
app.use(express.static(path.join(__dirname, "dist")));

// --- API Routes using Modular Routers ---
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/kyc", kycRoutes); 

// --- Health Check and Server Start ---
app.get("/hc", (_, res) => {
  res.send("<pre>OK</pre>");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}!`);
});
