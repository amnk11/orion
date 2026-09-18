import { pgTable, uuid, text, jsonb, integer, timestamp, index } from "drizzle-orm/pg-core";

export const outboxJobs = pgTable(
  "outbox_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobType: text("job_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"), // pending | processing | done | failed
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    runAfter: timestamp("run_after").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_jobs_status_run_after").on(table.status, table.runAfter),
  ]
);

export type OutboxJob = typeof outboxJobs.$inferSelect;
export type NewOutboxJob = typeof outboxJobs.$inferInsert;
