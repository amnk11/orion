import winston from "winston";
import { env } from "./env";

type LoggerLevel = "error" | "info" | "debug";

const level: LoggerLevel =
  env.LOGGER_LEVEL ?? (env.NODE_ENV === "development" ? "debug" : "error");

const isDevelopment = env.NODE_ENV === "development";

const SENSITIVE_KEYS = new Set([
  "patientName",
  "patientId",
  "demographics",
  "cookie",
  "authorization",
  "token",
  "password",
  "abhaMock"
]);

const redactPHI = winston.format((info) => {
  const redact = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(redact);
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_KEYS.has(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = typeof obj[key] === "object" ? redact(obj[key]) : obj[key];
      }
    }
    return result;
  };

  const newInfo = redact(info);
  
  // Copy symbols over so winston internals (like colorize) still work
  for (const sym of Object.getOwnPropertySymbols(info)) {
    newInfo[sym] = (info as any)[sym];
  }
  
  newInfo.level = info.level; // preserve level/message string formatting
  newInfo.message = typeof info.message === "object" ? redact(info.message) : info.message;
  return newInfo;
});

const format = isDevelopment
  ? winston.format.combine(
      redactPHI(),
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length
          ? `\n${JSON.stringify(meta, null, 2)}`
          : "";
        return `${timestamp} [${level}]: ${message}${metaString}`;
      }),
    )
  : winston.format.combine(redactPHI(), winston.format.timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: level,
  format: format,
  transports: [new winston.transports.Console()],
});
