import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./lib/config";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { authRouter } from "./modules/auth/auth.routes";

export function createApp(): Express {
  const app = express();

  // Security & basic middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(requestIdMiddleware);
  // Better Auth handler - mounted before body parsing middleware
  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(express.json({ limit: "1mb" }));

  // Root endpoint
  app.get("/", (_req, res) => {
    res.json({ name: "Orion API", status: "running" });
  });

  // Health endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      ts: new Date().toISOString(),
    });
  });

  // Orion auth routes
  app.use("/api/v1/auth", authRouter);

  // 404 handler for unmatched routes
  app.use(notFoundMiddleware);

  // Global error handler
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
export default app;
