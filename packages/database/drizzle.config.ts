import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./env";

import type { Config } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
}) satisfies Config;
