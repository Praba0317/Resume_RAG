import cors from "cors";
import express from "express";
import { pingDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { requestId } from "./middleware/requestId";
import { ingestionRoutes } from "./modules/ingestion/routes/ingestionRoutes";
import { retrievalRoutes } from "./modules/retrieval/routes/retrievalRoutes";

const startedAt = Date.now();

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(requestId);
app.use(logger);
app.use("/v1", ingestionRoutes);
app.use("/v1", retrievalRoutes);

app.get("/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    app: "resume-rag-backend",
    version: "1.0.0",
    uptime: (Date.now() - startedAt) / 1000,
  });
});

app.get("/v1/health/db", async (_req, res) => {
  try {
    const latencyMs = await pingDatabase();
    res.status(200).json({
      status: "ok",
      database: "mongodb",
      connected: true,
      latencyMs,
    });
  } catch (_error) {
    res.status(503).json({
      status: "error",
      database: "mongodb",
      connected: false,
      errorCode: "DB_CONNECTION_FAILED",
    });
  }
});

app.use(errorHandler);
