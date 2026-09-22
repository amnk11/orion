import { db, outboxJobs, eq, lte, and } from "@orion/db";
import { logger } from "../lib/logger";

let intervalId: NodeJS.Timeout | null = null;
let isProcessing = false;

export async function processOutbox() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    
    // Find pending jobs that are ready to run
    const pendingJobs = await db
      .select()
      .from(outboxJobs)
      .where(
        and(
          eq(outboxJobs.status, "pending"),
          lte(outboxJobs.runAfter, now)
        )
      )
      .limit(10);

    for (const job of pendingJobs) {
      logger.info(`[OutboxWorker] Processing job ${job.id} (Type: ${job.jobType})`);

      try {
        // Mock processing logic (e.g. sending SMS)
        logger.info(`[OutboxWorker] MOCK SMS DELIVERED: Payload = ${JSON.stringify(job.payload)}`);

        // Mark as done
        await db
          .update(outboxJobs)
          .set({ status: "done", updatedAt: new Date() })
          .where(eq(outboxJobs.id, job.id));

      } catch (err: any) {
        logger.error(`[OutboxWorker] Job ${job.id} failed:`, err);
        await db
          .update(outboxJobs)
          .set({ 
            status: "failed", 
            lastError: err.message || "Unknown error",
            attemptCount: job.attemptCount + 1,
            updatedAt: new Date()
          })
          .where(eq(outboxJobs.id, job.id));
      }
    }
  } catch (err) {
    logger.error("[OutboxWorker] Error during outbox processing:", err);
  } finally {
    isProcessing = false;
  }
}

export function startOutboxWorker(intervalMs = 5000) {
  if (intervalId) return;
  logger.info(`[OutboxWorker] Starting worker loop (interval: ${intervalMs}ms)`);
  intervalId = setInterval(processOutbox, intervalMs);
}

export function stopOutboxWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("[OutboxWorker] Stopped worker loop");
  }
}
