import { pgTable, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const protocols = pgTable("protocols", {
  code: text("code").primaryKey(), // anc_danger | adult_general
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0"),
  schemaJson: jsonb("schema_json").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Protocol = typeof protocols.$inferSelect;
export type NewProtocol = typeof protocols.$inferInsert;
