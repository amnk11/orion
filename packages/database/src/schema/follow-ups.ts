import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { careEpisodes } from "./care-episodes";
import { handoffs } from "./handoffs";
import { facilities } from "./facilities";
import { users } from "./better-auth";

/**
 * FollowUp — a task created from an Outcome (or high-risk flag) that keeps the
 * care episode accountable after the patient returns. Workflow UI/API arrives later.
 */
export const followUps = pgTable(
  "follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => careEpisodes.id),
    handoffId: uuid("handoff_id").references(() => handoffs.id),
    facilityId: uuid("facility_id")
      .notNull()
      .references(() => facilities.id), // responsible facility
    assignedRole: text("assigned_role"), // e.g. cho | mo | anm
    task: text("task").notNull(),
    dueAt: timestamp("due_at"),
    status: text("status").notNull().default("pending"), // pending | completed | missed | escalated
    completedAt: timestamp("completed_at"),
    completedBy: uuid("completed_by").references(() => users.id),
    completedClientEventId: text("completed_client_event_id"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_follow_ups_episode").on(table.episodeId),
    index("idx_follow_ups_facility_status_due").on(table.facilityId, table.status, table.dueAt),
    uniqueIndex("idx_follow_ups_idempotency_key").on(table.idempotencyKey),
  ]
);

export type FollowUp = typeof followUps.$inferSelect;
export type NewFollowUp = typeof followUps.$inferInsert;
