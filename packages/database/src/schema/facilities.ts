import { pgTable, uuid, text, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const facilities = pgTable(
  "facilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    name: text("name").notNull(),
    type: text("type"), // facility classification, e.g. aam | phc | chc | rh | sdh | dh
    tier: text("tier").notNull(), // care level/tier: AAM | sub_centre | phc | chc | rh | sdh | dh | medical_college
    isFru: boolean("is_fru").notNull().default(false),
    block: text("block"),
    district: text("district"),
    state: text("state"),
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_facilities_tier").on(table.tier),
    index("idx_facilities_district").on(table.district),
    index("idx_facilities_org_id").on(table.orgId),
  ]
);

export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;
