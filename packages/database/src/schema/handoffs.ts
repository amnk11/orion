import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { facilities } from "./facilities";
import { patients } from "./patients";
import { protocols } from "./protocols";
import { careEpisodes } from "./care-episodes";
import { assessments } from "./assessments";
import { users } from "./better-auth";

/**
 * Handoff — the central operational object of a care transition.
 * Lives inside a CareEpisode and is produced from an Assessment.
 *
 * State lifecycle (target, backend-enforced in @orion/domain):
 *   draft → sent → acknowledged → accepted → arrived → in_care
 *                     │            │                    ↓
 *                     │            ├→ no_show           outcome_recorded → follow_up_pending → closed
 *                     │            └→ closed
 *                     └→ cannot_accept ─→ redirected → sent (new destination leg) / closed
 *
 * Phase 1 note: `packetJson` is preserved as a clinical-summary snapshot for
 * backward compatibility with the existing create flow; the authoritative
 * assessment data now lives in the `assessments` table via `assessmentId`.
 */
export const handoffs = pgTable(
  "handoffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: text("public_code").notNull(),
    episodeId: uuid("episode_id").references(() => careEpisodes.id),
    assessmentId: uuid("assessment_id").references(() => assessments.id),
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
    state: text("state").notNull().default("sent"),
    reasonForReferral: text("reason_for_referral"),
    requestedServices: text("requested_services").array(),
    transportRequired: boolean("transport_required").notNull().default(false),
    transportRef: text("transport_ref"),
    teleconsultRef: text("teleconsult_ref"),
    expectedArrivalAt: timestamp("expected_arrival_at"),
    redirectReason: text("redirect_reason"),
    packetJson: jsonb("packet_json").notNull(), // clinical summary snapshot (kept for now)
    createdBy: uuid("created_by").references(() => users.id),
    idempotencyKey: text("idempotency_key").notNull(),
    clientEventId: text("client_event_id"), // offline-sync dedupe (foundation only)
    redirectCount: integer("redirect_count").notNull().default(0),
    syncedAt: timestamp("synced_at"),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_handoffs_public_code").on(table.publicCode),
    uniqueIndex("idx_handoffs_idempotency_key").on(table.idempotencyKey),
    index("idx_handoffs_episode").on(table.episodeId),
    index("idx_handoffs_assessment").on(table.assessmentId),
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
