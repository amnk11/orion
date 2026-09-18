import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().url().default("postgresql://orion:orion_dev_pass@localhost:5432/orion_dev"),
  BETTER_AUTH_SECRET: z.string().min(32).default("super_secret_random_string_here_at_least_32_chars"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:4000"),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }
  return result.data;
}

export const config = loadConfig();
export default config;
