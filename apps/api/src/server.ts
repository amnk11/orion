import http from "node:http";
import { app } from "./app";
import { config } from "./lib/config";
import { logger } from "./lib/logger";

import { startOutboxWorker } from "./workers/outbox.worker";

const server = http.createServer(app);

server.listen(config.PORT, () => {
  logger.info(`Orion API listening on port ${config.PORT} [${config.NODE_ENV}]`);
  if (config.NODE_ENV !== "test") {
    startOutboxWorker();
  }
});

export { server };
export default server;
