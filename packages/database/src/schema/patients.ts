import { pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { facilities } from "./facilities";

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name").notNull(),
    age: integer("age"),
    sex: text("sex"), // male | female | other
    abhaMock: text("abha_mock"), // Synthetic demo placeholder only — never a real ABHA id
    isSynthetic: boolean("is_synthetic").notNull().default(true),
    createdByFacilityId: uuid("created_by_facility_id").references(() => facilities.id),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_patients_created_by_facility").on(table.createdByFacilityId),
    uniqueIndex("idx_patients_idempotency_key").on(table.idempotencyKey),
  ]
);

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
