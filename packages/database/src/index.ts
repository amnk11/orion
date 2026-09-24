import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../env";
import * as schema from "./schema";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export const db: NodePgDatabase<typeof schema> = drizzle(env.DATABASE_URL, { schema });

export * from "drizzle-orm";
export * from "./schema";
export default db;
