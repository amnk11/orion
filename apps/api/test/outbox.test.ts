import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, outboxJobs, eq } from "@orion/db";
import { processOutbox } from "../src/workers/outbox.worker";

describe("Phase 9: Mock Outbox Processing", () => {
  let testJobId: string;

  beforeAll(async () => {
    // Insert a pending job
    const [job] = await db.insert(outboxJobs).values({
      jobType: "sms",
      payload: { phone: "+919999999999", message: "Your referral is created" },
      status: "pending",
      runAfter: new Date(Date.now() - 10000),
    }).returning();
    
    testJobId = job.id;
  });

  afterAll(async () => {
    await db.delete(outboxJobs).where(eq(outboxJobs.id, testJobId));
  });

  it("should pick up pending jobs and mark them as done", async () => {
    // Run the worker loop once manually
    await processOutbox();

    // Verify the job was marked as done
    const [job] = await db.select().from(outboxJobs).where(eq(outboxJobs.id, testJobId));
    
    expect(job).toBeDefined();
    expect(job.status).toBe("done");
  });
});
