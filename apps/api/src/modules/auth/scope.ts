import { db, handoffs, followUps, eq, or, and } from "@orion/db";
import type { AuthenticatedUser } from "./auth.middleware";

/**
 * Validates that the authenticated user has a facility assigned.
 * (Admin users might not have a facility, but clinical users must).
 */
export function assertFacilityMember(user: AuthenticatedUser): string {
  if (!user.facilityId) {
    throw new Error("USER_NOT_FACILITY_MEMBER");
  }
  return user.facilityId;
}

/**
 * Asserts that the user's facility is a party to the given handoff.
 * Returns true if allowed, otherwise false (or throws).
 */
export async function assertPartyToHandoff(user: AuthenticatedUser, handoffId: string): Promise<boolean> {
  // Admins can see anything
  if (user.role === "admin") return true;

  const facilityId = assertFacilityMember(user);

  const [handoff] = await db
    .select({ id: handoffs.id })
    .from(handoffs)
    .where(
      and(
        eq(handoffs.id, handoffId),
        or(
          eq(handoffs.originFacilityId, facilityId),
          eq(handoffs.destinationFacilityId, facilityId),
          eq(handoffs.currentDestinationFacilityId, facilityId)
        )
      )
    )
    .limit(1);

  if (!handoff) {
    throw new Error("NOT_PARTY_TO_HANDOFF");
  }
  return true;
}

/**
 * Asserts that the user's facility is the current destination for the handoff.
 * Used for accept/redirect/arrive operations.
 */
export async function assertCurrentDestination(user: AuthenticatedUser, handoffId: string): Promise<boolean> {
  if (user.role === "admin") return true;

  const facilityId = assertFacilityMember(user);

  const [handoff] = await db
    .select({ id: handoffs.id })
    .from(handoffs)
    .where(
      and(
        eq(handoffs.id, handoffId),
        eq(handoffs.currentDestinationFacilityId, facilityId)
      )
    )
    .limit(1);

  if (!handoff) {
    throw new Error("NOT_CURRENT_DESTINATION");
  }
  return true;
}

/**
 * Asserts that the user's facility is responsible for the follow-up.
 */
export async function assertResponsibleFacility(user: AuthenticatedUser, followUpId: string): Promise<boolean> {
  if (user.role === "admin") return true;

  const facilityId = assertFacilityMember(user);

  const [followUp] = await db
    .select({ id: followUps.id })
    .from(followUps)
    .where(
      and(
        eq(followUps.id, followUpId),
        eq(followUps.facilityId, facilityId)
      )
    )
    .limit(1);

  if (!followUp) {
    throw new Error("NOT_RESPONSIBLE_FACILITY");
  }
  return true;
}

/**
 * Asserts that the user is a supervisor.
 * (In the future, this might also check organization scope).
 */
export function assertSupervisor(user: AuthenticatedUser): boolean {
  if (user.role !== "supervisor" && user.role !== "admin") {
    throw new Error("NOT_SUPERVISOR");
  }
  return true;
}
