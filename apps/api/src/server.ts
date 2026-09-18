import http from "node:http";
import { app } from "./app";
import { config } from "./lib/config";
import { logger } from "./lib/logger";

const server = http.createServer(app);

server.listen(config.PORT, () => {
  logger.info(`Orion API listening on port ${config.PORT} [${config.NODE_ENV}]`);
});

export { server };
export default server;
