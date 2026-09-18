import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { logger } from "../lib/logger";

export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
