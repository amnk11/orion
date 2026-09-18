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
import { users } from "./better-auth";

export const handoffEvents = pgTable(
  "handoff_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventSeq: bigserial("event_seq", { mode: "number" }).notNull().unique(),
    handoffId: uuid("handoff_id")
      .notNull()
      .references(() => handoffs.id),
    eventType: text("event_type").notNull(),
    prevState: text("prev_state"),
    nextState: text("next_state"),
    actorId: uuid("actor_id").references(() => users.id),
    payload: jsonb("payload"),
    clientEventId: text("client_event_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_events_handoff_created").on(table.handoffId, table.createdAt),
    index("idx_events_handoff_seq").on(table.handoffId, table.eventSeq),
    uniqueIndex("idx_events_client_event_id")
      .on(table.clientEventId)
      .where(sql`client_event_id IS NOT NULL`),
  ]
);

// Helper for conditional partial index
import { sql } from "drizzle-orm";

export type HandoffEvent = typeof handoffEvents.$inferSelect;
export type NewHandoffEvent = typeof handoffEvents.$inferInsert;
