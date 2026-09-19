import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { careEpisodes } from "./care-episodes";
import { protocols } from "./protocols";
import { users } from "./better-auth";

/**
 * Assessment — a structured, protocol-assisted triage captured independently of
 * the Handoff packet so it is identifiable and reusable (e.g. by counter-referral).
 * The triage engine stays in @orion/protocols; this only persists inputs + result.
 */
export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => careEpisodes.id),
    protocolCode: text("protocol_code")
      .notNull()
      .references(() => protocols.code),
    answersJson: jsonb("answers_json").notNull(), // raw protocol field inputs
    triageJson: jsonb("triage_json").notNull(), // { urgency, matched_rules, completeness }
    assessedBy: uuid("assessed_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_assessments_episode").on(table.episodeId),
    index("idx_assessments_protocol").on(table.protocolCode),
  ]
);

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
