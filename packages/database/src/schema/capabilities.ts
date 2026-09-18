import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { facilities } from "./facilities";
import { users } from "./better-auth";

export const capabilities = pgTable(
  "capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),
    serviceCode: text("service_code").notNull(), // obgyn | functional_ot | blood_bank | icu | lab
    status: text("status").notNull(), // available | unavailable | unknown
    attestedBy: uuid("attested_by").references(() => users.id),
    attestedAt: timestamp("attested_at").notNull().defaultNow(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_caps_facility_service").on(
      table.facilityId,
      table.serviceCode,
      table.attestedAt
    ),
  ]
);

export type Capability = typeof capabilities.$inferSelect;
export type NewCapability = typeof capabilities.$inferInsert;
