import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { facilities } from "./facilities";

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name").notNull(),
    age: integer("age"),
    sex: text("sex"), // male | female | other
    abhaMock: text("abha_mock"), // Synthetic demo placeholder only
    createdByFacilityId: uuid("created_by_facility_id").references(() => facilities.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_patients_created_by_facility").on(table.createdByFacilityId),
  ]
);

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
