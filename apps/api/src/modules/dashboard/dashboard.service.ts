import {
  db,
  handoffs,
  handoffEvents,
  followUps,
  eq,
  and,
  or,
  sql,
  inArray,
} from "@orion/db";
import { facilitiesService } from "../facilities/facilities.service";

export class DashboardService {
  async getSummary(facilityId: string) {
    // A supervisor oversees their own facility. Visible handoffs are those where
    // the facility appears as the origin, the initial destination, OR the current
    // destination (updated after a redirect).
    //
    // ROOT CAUSE FIX: `currentDestinationFacilityId` is nullable — on newly-sent
    // handoffs it is NULL, which never satisfies an = comparison in SQL.
    // Without `destinationFacilityId` in the condition, all sent/acknowledged
    // handoffs (i.e. the ageing population) were silently excluded.
    const baseCondition = or(
      eq(handoffs.originFacilityId, facilityId),
      eq(handoffs.destinationFacilityId, facilityId),
      eq(handoffs.currentDestinationFacilityId, facilityId)
    );

    // 1. Fetch all visible handoffs once and derive all counts in-memory.
    const allHandoffs = await db.select().from(handoffs).where(baseCondition);

    const stateCounts: Record<string, number> = {
      pending: 0,
      accepted: 0,
      cannot_accept: 0,
      redirected: 0,
      arrived: 0,
      no_show: 0,
      in_care: 0,
      outcome_recorded: 0,
      closed: 0,
    };

    const ageing = {
      "<1h": 0,
      "1-4h": 0,
      "4-24h": 0,
      "1-3d": 0,
      ">3d": 0,
    };

    // BUG-20 FIX: States that represent "still waiting / not yet accepted at destination"
    const PENDING_STATES = new Set(["sent", "acknowledged", "draft", "pending"]);

    const now = Date.now();
    let totalOutcomesExpected = 0;
    let outcomesRecorded = 0;

    for (const h of allHandoffs) {
      const state = h.state;

      // BUG-01 FIX: No longer double-counts. pending-equivalent states map cleanly
      // to the pending bucket; all other known states increment their own bucket.
      if (PENDING_STATES.has(state)) {
        stateCounts["pending"] = (stateCounts["pending"] ?? 0) + 1;

        // BUG-20 FIX: Ageing applied to all waiting states (not just sent/acknowledged/draft)
        const ageMs = now - h.createdAt.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);

        if (ageHours < 1) ageing["<1h"]++;
        else if (ageHours <= 4) ageing["1-4h"]++;
        else if (ageHours <= 24) ageing["4-24h"]++;
        else if (ageHours <= 72) ageing["1-3d"]++;
        else ageing[">3d"]++;
      } else if (state in stateCounts) {
        stateCounts[state] = (stateCounts[state] ?? 0) + 1;
      }
      // Unknown states are intentionally ignored rather than corrupting the pending count.

      // Outcomes rate
      if (state === "outcome_recorded" || state === "closed") {
        totalOutcomesExpected++;
        outcomesRecorded++;
      } else if (state === "arrived" || state === "in_care") {
        totalOutcomesExpected++;
      }
    }

    // 2. Redirect Reasons
    // BUG-06 FIX: Use innerJoin (not leftJoin) — events must belong to a visible handoff.
    // BUG-19 FIX: Use the dedicated `reason` column on handoff_events directly instead
    //             of extracting from the jsonb `payload` column.
    const redirectEvents = await db
      .select({ reason: handoffEvents.reason })
      .from(handoffEvents)
      .innerJoin(handoffs, eq(handoffEvents.handoffId, handoffs.id))
      .where(
        and(
          baseCondition,
          inArray(handoffEvents.eventType, [
            "handoff_cannot_accept",
            "handoff_redirected",
          ])
        )
      );

    const redirectReasons: Record<string, number> = {};
    for (const event of redirectEvents) {
      if (event.reason) {
        redirectReasons[event.reason] =
          (redirectReasons[event.reason] || 0) + 1;
      }
    }

    // 3. Follow-up completion
    // BUG-13 FIX: Scope follow-ups to only those attached to handoffs visible to this
    //             supervisor (via handoffId), not every follow-up for the facility.
    // NEW-03 FIX: followUps.handoffId is nullable. Some follow-ups may be created
    //             without a linked handoff (handoffId = null). These were silently
    //             excluded by the inArray filter. We run a second facilityId-scoped
    //             query and de-duplicate by id so nothing is missed.
    let fTotal = 0;
    let fCompleted = 0;
    let fOverdue = 0;
    let fPending = 0;

    const visibleHandoffIds = allHandoffs.map((h) => h.id);
    const seenFollowUpIds = new Set<string>();

    async function tallyFollowUps(rows: { id: string; status: string; dueAt: Date | null }[]) {
      for (const f of rows) {
        if (seenFollowUpIds.has(f.id)) continue;
        seenFollowUpIds.add(f.id);
        fTotal++;
        if (f.status === "completed") {
          fCompleted++;
        } else if (f.status === "pending") {
          fPending++;
          if (f.dueAt && f.dueAt.getTime() < now) {
            fOverdue++;
          }
        }
      }
    }

    if (visibleHandoffIds.length > 0) {
      const handoffLinked = await db
        .select()
        .from(followUps)
        .where(inArray(followUps.handoffId, visibleHandoffIds));
      await tallyFollowUps(handoffLinked);
    }

    // Also pick up orphaned follow-ups (handoffId IS NULL) assigned to this facility.
    const facilityOrphaned = await db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.facilityId, facilityId),
          sql`${followUps.handoffId} IS NULL`
        )
      );
    await tallyFollowUps(facilityOrphaned);

    // 4. Capability Freshness
    const caps = await facilitiesService.getCapabilitiesByFacility(facilityId);
    const freshness: Record<string, number> = {
      FRESH: 0,
      STALE: 0,
      VERY_STALE: 0,
      UNKNOWN: 0,
    };

    for (const c of caps) {
      freshness[c.freshness] = (freshness[c.freshness] || 0) + 1;
    }

    // BUG-03 FIX: Use explicit variable for denominator — no operator-precedence ambiguity.
    const arr = stateCounts.arrived ?? 0;
    const ns = stateCounts.no_show ?? 0;
    const ic = stateCounts.in_care ?? 0;
    const orState = stateCounts.outcome_recorded ?? 0;
    const cl = stateCounts.closed ?? 0;

    const noShowDenominator = arr + ns + ic + orState + cl;
    const noShowRate =
      noShowDenominator > 0 ? Math.round((ns / noShowDenominator) * 100) : 0;

    // BUG-08 FIX: Return null when there is no data rather than showing a misleading 0%.
    // The frontend interface must accept `number | null` for this field.
    const outcomeRate =
      totalOutcomesExpected > 0
        ? Math.round((outcomesRecorded / totalOutcomesExpected) * 100)
        : null;

    return {
      stateCounts,
      ageing,
      redirectReasons,
      noShowRate,
      outcomeRate,
      followUps: {
        total: fTotal,
        completed: fCompleted,
        overdue: fOverdue,
        pending: fPending,
      },
      capabilityFreshness: {
        ...freshness,
        // BUG-14 FIX: Expose total so the frontend can detect and communicate
        // when capabilities have not been reported for this facility.
        total: caps.length,
      },
    };
  }
}

export const dashboardService = new DashboardService();
