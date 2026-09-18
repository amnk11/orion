import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import { config } from "./config";

export const auth = betterAuth({
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "origin",
        input: false,
      },
      facilityId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [config.CORS_ORIGIN, "http://localhost:3000"],
});

export type Auth = typeof auth;
export default auth;
