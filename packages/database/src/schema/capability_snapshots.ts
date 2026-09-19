import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { facilities } from "./facilities";
import { users } from "./better-auth";

/**
 * CapabilitySnapshot — a point-in-time, attested record of what a facility can do.
 *
 * Status is one of:
 *   verified_available | verified_unavailable | unknown
 *
 * STALE is deliberately NOT stored — it is DERIVED from `attestedAt` plus the
 * per-service freshness window. Never present fixture/attested data as "live".
 */
export const capabilitySnapshots = pgTable(
  "capability_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id),
    serviceCode: text("service_code").notNull(), // obgyn | functional_ot | blood_bank | icu | lab | ...
    status: text("status").notNull(), // verified_available | verified_unavailable | unknown
    source: text("source").notNull().default("attestation"), // attestation | fixture | api
    attestedBy: uuid("attested_by").references(() => users.id),
    attestedAt: timestamp("attested_at").notNull().defaultNow(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_caps_facility_service").on(table.facilityId, table.serviceCode, table.attestedAt),
    // One current snapshot per facility+service (seed idempotency relies on this).
    uniqueIndex("idx_caps_facility_service_unique").on(table.facilityId, table.serviceCode),
  ]
);

export type CapabilitySnapshot = typeof capabilitySnapshots.$inferSelect;
export type NewCapabilitySnapshot = typeof capabilitySnapshots.$inferInsert;
