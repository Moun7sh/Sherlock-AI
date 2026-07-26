import express from "express";
import "express-async-errors"; // patches Express to forward rejected promises to error handler
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { WebSocketServer } from "ws";
import http from "http";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { authRouter } from "./routes/auth";
import { casesRouter } from "./routes/cases";
import { personsRouter } from "./routes/persons";
import { vehiclesRouter } from "./routes/vehicles";
import { evidenceRouter } from "./routes/evidence";
import { searchRouter } from "./routes/search";
import { analyticsRouter } from "./routes/analytics";
import { networkRouter } from "./routes/network";
import { agentsRouter } from "./routes/agents";
import { notificationsRouter } from "./routes/notifications";
import { auditRouter } from "./routes/audit";
import { usersRouter } from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { setupWebSocket } from "./services/websocket";
import { UPLOAD_DIR } from "./services/upload";

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || "3001", 10);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate limiting — different limits for auth vs general
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: "Too many auth attempts" } }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_DIR));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/cases", casesRouter);
app.use("/api/persons", personsRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/evidence", evidenceRouter);
app.use("/api/search", searchRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/network", networkRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Serve client in production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => res.sendFile(path.join(clientPath, "index.html")));
}

app.use(errorHandler);

// ─── WebSocket ───────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });
setupWebSocket(wss);

// ─── Start ───────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n  🔍 Sherlock AI server on http://localhost:${PORT}`);
  console.log(`  📡 WebSocket on ws://localhost:${PORT}/ws`);
  console.log(`  📁 Uploads in ${UPLOAD_DIR}\n`);
});

export default app;
