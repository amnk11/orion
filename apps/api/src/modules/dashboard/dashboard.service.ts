import { db, handoffs, handoffEvents, followUps, outcomes, capabilitySnapshots, eq, and, or, sql, desc, inArray } from "@orion/db";
import { facilitiesService } from "../facilities/facilities.service";

export class DashboardService {
  async getSummary(facilityId: string) {
    // A supervisor oversees their own facility.
    // So we fetch metrics where origin or destination is the facility, or where currentDestination is the facility.
    // For simplicity of District Dashboard (typically district hospital is destination):
    // Let's get all handoffs where facility is involved.
    
    const baseCondition = or(
      eq(handoffs.originFacilityId, facilityId),
      eq(handoffs.currentDestinationFacilityId, facilityId)
    );

    // 1. State Counts
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
      closed: 0
    };

    const ageing = {
      "<1h": 0,
      "1-4h": 0,
      "4-24h": 0,
      "1-3d": 0,
      ">3d": 0,
    };

    const now = Date.now();
    let totalOutcomesExpected = 0;
    let outcomesRecorded = 0;

    for (const h of allHandoffs) {
      // States
      const state = h.state;
      if (stateCounts[state] !== undefined) {
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      } else {
        stateCounts.pending = (stateCounts.pending || 0) + 1; // fallback for draft/sent
      }

      if (state === "sent" || state === "acknowledged" || state === "draft") {
        stateCounts.pending = (stateCounts.pending || 0) + 1;
        stateCounts[state] = (stateCounts[state] || 0) - 1; // adjust fallback
        
        const ageMs = now - h.createdAt.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        
        if (ageHours < 1) ageing["<1h"]++;
        else if (ageHours <= 4) ageing["1-4h"]++;
        else if (ageHours <= 24) ageing["4-24h"]++;
        else if (ageHours <= 72) ageing["1-3d"]++;
        else ageing[">3d"]++;
      }

      // Outcomes rate
      if (["outcome_recorded", "closed"].includes(state)) {
        totalOutcomesExpected++;
        outcomesRecorded++;
      } else if (["arrived", "in_care"].includes(state)) {
        totalOutcomesExpected++;
      }
    }

    // 2. Redirect Reasons
    const redirectEvents = await db
      .select({
        reason: sql<string>`payload->>'reason'`
      })
      .from(handoffEvents)
      .leftJoin(handoffs, eq(handoffEvents.handoffId, handoffs.id))
      .where(
        and(
          baseCondition,
          inArray(handoffEvents.eventType, ["handoff_cannot_accept", "handoff_redirected"])
        )
      );

    const redirectReasons: Record<string, number> = {};
    for (const event of redirectEvents) {
      if (event.reason) {
        redirectReasons[event.reason] = (redirectReasons[event.reason] || 0) + 1;
      }
    }

    // 3. Follow-up completion
    const facilityFollowUps = await db
      .select()
      .from(followUps)
      .where(eq(followUps.facilityId, facilityId));

    let fTotal = 0;
    let fCompleted = 0;
    let fOverdue = 0;
    let fPending = 0;

    for (const f of facilityFollowUps) {
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

    // 4. Capability Freshness
    const caps = await facilitiesService.getCapabilitiesByFacility(facilityId);
    const freshness: Record<string, number> = {
      FRESH: 0,
      STALE: 0,
      VERY_STALE: 0,
      UNKNOWN: 0
    };

    for (const c of caps) {
      freshness[c.freshness] = (freshness[c.freshness] || 0) + 1;
    }

    const arr = stateCounts.arrived || 0;
    const ns = stateCounts.no_show || 0;
    const ic = stateCounts.in_care || 0;
    const orState = stateCounts.outcome_recorded || 0;
    const cl = stateCounts.closed || 0;

    const noShowRate = (ns / (arr + ns + ic + orState + cl || 1)) * 100;
    const outcomeRate = (outcomesRecorded / (totalOutcomesExpected || 1)) * 100;

    return {
      stateCounts,
      ageing,
      redirectReasons,
      noShowRate: Math.round(noShowRate),
      outcomeRate: Math.round(outcomeRate),
      followUps: {
        total: fTotal,
        completed: fCompleted,
        overdue: fOverdue,
        pending: fPending
      },
      capabilityFreshness: freshness,
    };
  }
}

export const dashboardService = new DashboardService();
