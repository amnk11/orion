import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { handoffs } from "./handoffs";
import { careEpisodes } from "./care-episodes";
import { facilities } from "./facilities";
import { users } from "./better-auth";

/**
 * Outcome (return note) — the destination's structured return summary that drives
 * counter-referral back to origin and spawns the follow-up task.
 * This is NOT a full discharge summary / EMR — only the care-transition return note.
 * (DB foundation only; the outcome API arrives in a later phase.)
 */
export const outcomes = pgTable(
  "outcomes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handoffId: uuid("handoff_id")
      .notNull()
      .references(() => handoffs.id),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => careEpisodes.id),
    disposition: text("disposition").notNull(), // treated_returned | admitted | referred_on | deceased | other
    summary: text("summary").notNull(),
    testsAdvised: text("tests_advised").array(), // e.g. ["CBC"]
    adviceSummary: text("advice_summary"),
    followUpDueAt: timestamp("follow_up_due_at"),
    followUpFacilityId: uuid("follow_up_facility_id").references(() => facilities.id),
    recordedBy: uuid("recorded_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_outcomes_handoff").on(table.handoffId), // one outcome per handoff
    index("idx_outcomes_episode").on(table.episodeId),
    index("idx_outcomes_follow_up_facility").on(table.followUpFacilityId),
  ]
);

export type Outcome = typeof outcomes.$inferSelect;
export type NewOutcome = typeof outcomes.$inferInsert;
