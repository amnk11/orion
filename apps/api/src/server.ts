import express from "express";
import cors from "cors";
import { logger } from "@orion/logger";
import { env } from "./env";

export const app = express();

if (env.NODE_ENV !== "production") {
  app.use(cors({ origin: "*" }));
} else {
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
}

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "Orion API", status: "running" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// TODO: mount route modules here as they are built
// app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/facilities", facilitiesRouter);
// app.use("/api/v1/handoffs", handoffsRouter);

logger.info("Express app configured");

export default app;
