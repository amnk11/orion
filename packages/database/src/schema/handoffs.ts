import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { facilities } from "./facilities";
import { patients } from "./patients";
import { protocols } from "./protocols";
import { users } from "./better-auth";

export const handoffs = pgTable(
  "handoffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: text("public_code").notNull(),
    patientId: uuid("patient_id").references(() => patients.id),
    originFacilityId: uuid("origin_facility_id")
      .notNull()
      .references(() => facilities.id),
    destinationFacilityId: uuid("destination_facility_id")
      .notNull()
      .references(() => facilities.id),
    currentDestinationFacilityId: uuid("current_destination_facility_id").references(
      () => facilities.id
    ),
    protocolCode: text("protocol_code")
      .notNull()
      .references(() => protocols.code),
    urgency: text("urgency").notNull(), // red | orange | green
    state: text("state").notNull().default("sent"), // draft|sent|accepted|cannot_accept|redirected|arrived|no_show|return_noted|closed
    packetJson: jsonb("packet_json").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    idempotencyKey: text("idempotency_key").notNull(),
    redirectCount: integer("redirect_count").notNull().default(0),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_handoffs_public_code").on(table.publicCode),
    uniqueIndex("idx_handoffs_idempotency_key").on(table.idempotencyKey),
    index("idx_handoffs_dest_state").on(
      table.destinationFacilityId,
      table.state,
      table.createdAt
    ),
    index("idx_handoffs_current_dest_state").on(
      table.currentDestinationFacilityId,
      table.state,
      table.createdAt
    ),
    index("idx_handoffs_origin").on(table.originFacilityId, table.createdAt),
    index("idx_handoffs_state").on(table.state, table.createdAt),
  ]
);

export type Handoff = typeof handoffs.$inferSelect;
export type NewHandoff = typeof handoffs.$inferInsert;
