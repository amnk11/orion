import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  jsonb,
  bigserial,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { handoffs } from "./handoffs";
import { careEpisodes } from "./care-episodes";
import { facilities } from "./facilities";
import { users } from "./better-auth";

/**
 * HandoffEvent — immutable, append-only audit/audit-trail record.
 * Every state transition writes exactly one event capturing actor, role, facility,
 * previous/next state, reason and payload. `clientEventId` enables idempotent
 * offline-sync dedupe (foundation only; sync engine arrives in a later phase).
 */
export const handoffEvents = pgTable(
  "handoff_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventSeq: bigserial("event_seq", { mode: "number" }).notNull().unique(),
    handoffId: uuid("handoff_id")
      .notNull()
      .references(() => handoffs.id),
    episodeId: uuid("episode_id").references(() => careEpisodes.id),
    eventType: text("event_type").notNull(),
    prevState: text("prev_state"),
    nextState: text("next_state"),
    actorId: uuid("actor_id").references(() => users.id),
    actorRole: text("actor_role"), // snapshot of actor role at event time
    facilityId: uuid("facility_id").references(() => facilities.id), // facility where action occurred
    reason: text("reason"), // e.g. cannot_accept / redirect reason
    payload: jsonb("payload"),
    clientEventId: text("client_event_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_events_handoff_created").on(table.handoffId, table.createdAt),
    index("idx_events_handoff_seq").on(table.handoffId, table.eventSeq),
    index("idx_events_episode").on(table.episodeId),
    index("idx_events_facility").on(table.facilityId),
    uniqueIndex("idx_events_client_event_id")
      .on(table.clientEventId)
      .where(sql`client_event_id IS NOT NULL`),
  ]
);

export type HandoffEvent = typeof handoffEvents.$inferSelect;
export type NewHandoffEvent = typeof handoffEvents.$inferInsert;
