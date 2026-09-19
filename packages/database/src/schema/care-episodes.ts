import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { facilities } from "./facilities";
import { patients } from "./patients";

/**
 * CareEpisode — the larger patient journey that wraps one or more Handoffs.
 * The Handoff remains the central transaction; the episode links
 * assessment → handoff(s) → outcome → follow-up → closure.
 */
export const careEpisodes = pgTable(
  "care_episodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: text("public_code").notNull(), // e.g. CE-7K2P
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id),
    openedByFacilityId: uuid("opened_by_facility_id")
      .notNull()
      .references(() => facilities.id),
    status: text("status").notNull().default("open"), // open | closed
    openedAt: timestamp("opened_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
    closeReason: text("close_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_care_episodes_public_code").on(table.publicCode),
    index("idx_care_episodes_patient").on(table.patientId),
    index("idx_care_episodes_opened_by_facility").on(table.openedByFacilityId),
    index("idx_care_episodes_status").on(table.status, table.openedAt),
  ]
);

export type CareEpisode = typeof careEpisodes.$inferSelect;
export type NewCareEpisode = typeof careEpisodes.$inferInsert;
