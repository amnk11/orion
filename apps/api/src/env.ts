import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

function createEnv(raw: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(raw);
  if (!result.success) throw new Error(`Invalid env: ${result.error.message}`);
  return result.data;
}

export const env = createEnv(process.env);
