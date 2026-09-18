import http from "node:http";
import { logger } from "@orion/logger";
import { app } from "./server";
import { env } from "./env";

async function init() {
  try {
    const server = http.createServer(app);
    server.listen(env.PORT, () => {
      logger.info(`Orion API running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
}

init();
