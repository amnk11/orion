import { db, handoffs, handoffEvents, outboxJobs, eq, sql } from "@orion/db";
import { assertTransition, getValidNextStates, HandoffState, CannotAcceptReason } from "@orion/domain";
import { z } from "zod";
import crypto from "crypto";

export class TransitionError extends Error {
  constructor(
    public currentState: string,
    public attemptedTransition: string,
    public validNextStates: string[],
    message = "Invalid state transition"
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

interface TransitionParams {
  handoffId: string;
  actorId: string;
  actorRole: string;
  facilityId: string;
  targetState: HandoffState;
  clientEventId?: string;
  payload?: any;
  reason?: string;
  mutationFn?: (handoff: any, tx: any) => Promise<any>;
}

export const handoffsTransitions = {
  async executeTransition({
    handoffId,
    actorId,
    actorRole,
    facilityId,
    targetState,
    clientEventId,
    payload,
    reason,
    mutationFn,
  }: TransitionParams) {
    return await db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(handoffs)
        .where(eq(handoffs.id, handoffId))
        .for("update");
      if (existingRows.length === 0) {
        throw new Error("NOT_FOUND");
      }
      const handoff = existingRows[0] as any;

      // 2. Client Event deduplication
      if (clientEventId) {
        const existingEvent = await tx
          .select()
          .from(handoffEvents)
          .where(eq(handoffEvents.clientEventId, clientEventId))
          .limit(1);

        if (existingEvent.length > 0) {
          const ev = existingEvent[0];
          if (ev) {
            if (ev.handoffId !== handoffId || ev.nextState !== targetState) {
              throw new Error("CONFLICT_CLIENT_EVENT");
            }
            return { handoff, event: ev, isDuplicate: true };
          }
        }
      }

      // 3. Authorization constraints
      const isOriginAction = targetState === "sent" || targetState === "closed"; // closed by origin when no_show or follow_up_pending
      const isDestAction = ["acknowledged", "accepted", "cannot_accept", "redirected", "arrived", "no_show", "in_care", "outcome_recorded"].includes(targetState);

      if (isDestAction) {
        if (handoff.currentDestinationFacilityId !== facilityId) {
          throw new Error("UNAUTHORIZED_FACILITY");
        }
      } else if (isOriginAction) {
        if (handoff.originFacilityId !== facilityId) {
          throw new Error("UNAUTHORIZED_FACILITY");
        }
      }

      // 4. Assert Transition
      const currentState = handoff.state as HandoffState;
      let eventType;
      try {
        eventType = assertTransition(currentState, targetState);
      } catch (err) {
        throw new TransitionError(currentState, targetState, getValidNextStates(currentState));
      }

      // 5. Apply custom mutations
      let updateData: any = { state: targetState, updatedAt: sql`now()` };
      if (targetState === "closed") {
        updateData.closedAt = sql`now()`;
      }

      if (mutationFn) {
        const extraUpdates = await mutationFn(handoff, tx);
        if (extraUpdates) {
          updateData = { ...updateData, ...extraUpdates };
        }
      }

      const [updatedHandoff] = await tx
        .update(handoffs)
        .set(updateData)
        .where(eq(handoffs.id, handoffId))
        .returning();
        
      if (!updatedHandoff) {
        throw new Error("NOT_FOUND");
      }

      // 6. Record Event
      const [newEvent] = await tx
        .insert(handoffEvents)
        .values({
          handoffId,
          episodeId: updatedHandoff.episodeId,
          eventType,
          prevState: currentState,
          nextState: targetState,
          actorId,
          actorRole,
          facilityId,
          reason,
          payload,
          clientEventId,
        })
        .returning();

      // 7. Queue Outbox job if necessary
      if (targetState === "accepted" || targetState === "redirected" || targetState === "cannot_accept") {
        await tx.insert(outboxJobs).values({
          jobType: "sms_notification",
          payload: {
            handoffId,
            message: `Referral ${updatedHandoff.publicCode} state changed to ${targetState}`,
          },
        });
      }

      return { handoff: updatedHandoff, event: newEvent, isDuplicate: false };
    });
  },
};
