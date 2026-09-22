import { db, facilities, capabilitySnapshots, eq, desc, and } from "@orion/db";
import type { Facility, CapabilitySnapshot } from "@orion/db";
import {
  getCapabilitySnapshotView,
  toDbCapabilityStatus,
  CAPABILITY_SERVICE_LABELS,
  type CapabilityStatus,
  type CapabilityFreshness,
} from "@orion/domain";

/**
 * Public API DTO for a capability snapshot.
 * Exposes the BUSINESS status (AVAILABLE | UNAVAILABLE | UNKNOWN) plus the
 * DERIVED freshness. Internal columns (attestedBy, source, createdAt) are
 * deliberately not exposed.
 */
export interface CapabilityDto {
  id: string;
  serviceCode: string;
  serviceLabel: string;
  status: CapabilityStatus;
  freshness: CapabilityFreshness;
  attestedAt: string | null;
  note: string | null;
}

function toCapabilityDto(snapshot: CapabilitySnapshot): CapabilityDto {
  const view = getCapabilitySnapshotView({
    status: snapshot.status,
    attestedAt: snapshot.attestedAt,
  });
  return {
    id: snapshot.id,
    serviceCode: snapshot.serviceCode,
    serviceLabel:
      CAPABILITY_SERVICE_LABELS[snapshot.serviceCode] ??
      snapshot.serviceCode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    status: view.status,
    freshness: view.freshness,
    attestedAt: view.attestedAt,
    note: snapshot.note,
  };
}

export class FacilitiesService {
  /**
   * Retrieves all facilities.
   */
  async getFacilities(): Promise<Facility[]> {
    return db.select().from(facilities).orderBy(facilities.name);
  }

  /**
   * Retrieves a specific facility.
   */
  async getFacilityById(id: string): Promise<Facility | null> {
    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id))
      .limit(1);

    return facility || null;
  }

  /**
   * Retrieves capabilities for a facility.
   * Gets the latest attested capability for each service.
   */
  async getCapabilitiesByFacility(facilityId: string): Promise<CapabilityDto[]> {
    // In PostgreSQL, to get the "latest" per serviceCode without complex subqueries in Drizzle,
    // we can select all for the facility, order by attestedAt desc, and filter in memory,
    // or use a generic select and reduce. Since capabilities count per facility is small,
    // memory reduction is efficient and clean.
    const allCaps = await db
      .select()
      .from(capabilitySnapshots)
      .where(eq(capabilitySnapshots.facilityId, facilityId))
      .orderBy(desc(capabilitySnapshots.attestedAt));

    const latestPerService = new Map<string, CapabilitySnapshot>();
    for (const cap of allCaps) {
      if (!latestPerService.has(cap.serviceCode)) {
        latestPerService.set(cap.serviceCode, cap);
      }
    }

    return Array.from(latestPerService.values())
      .map(toCapabilityDto)
      .sort((a, b) => a.serviceLabel.localeCompare(b.serviceLabel));
  }

  /**
   * Retrieves a single capability snapshot by id.
   */
  async getCapabilityById(id: string): Promise<CapabilitySnapshot | null> {
    const [snapshot] = await db
      .select()
      .from(capabilitySnapshots)
      .where(eq(capabilitySnapshots.id, id))
      .limit(1);

    return snapshot || null;
  }

  /**
   * Attests (creates or refreshes) the capability snapshot for a
   * facility + service. The table holds ONE current snapshot per
   * facility+service (unique index), so a new attestation replaces the
   * previous one and resets `attestedAt` to now — an attestation always
   * reflects the moment it was made.
   */
  async attestCapability(input: {
    facilityId: string;
    serviceCode: string;
    status: CapabilityStatus;
    note?: string;
    attestedBy: string;
  }): Promise<CapabilityDto> {
    const dbStatus = toDbCapabilityStatus(input.status);
    const now = new Date();

    const [existing] = await db
      .select()
      .from(capabilitySnapshots)
      .where(
        and(
          eq(capabilitySnapshots.facilityId, input.facilityId),
          eq(capabilitySnapshots.serviceCode, input.serviceCode)
        )
      )
      .limit(1);

    let saved: CapabilitySnapshot | undefined;
    if (existing) {
      [saved] = await db
        .update(capabilitySnapshots)
        .set({
          status: dbStatus,
          note: input.note ?? existing.note,
          source: "attestation",
          attestedBy: input.attestedBy,
          attestedAt: now,
        })
        .where(eq(capabilitySnapshots.id, existing.id))
        .returning();
    } else {
      [saved] = await db
        .insert(capabilitySnapshots)
        .values({
          facilityId: input.facilityId,
          serviceCode: input.serviceCode,
          status: dbStatus,
          note: input.note ?? null,
          source: "attestation",
          attestedBy: input.attestedBy,
          attestedAt: now,
        })
        .returning();
    }

    if (!saved) {
      throw new Error("Failed to persist capability attestation");
    }
    return toCapabilityDto(saved);
  }

  /**
   * Re-attests an existing snapshot by id (PUT semantics).
   */
  async updateCapabilityById(
    id: string,
    input: { status: CapabilityStatus; note?: string; attestedBy: string }
  ): Promise<CapabilityDto | null> {
    const existing = await this.getCapabilityById(id);
    if (!existing) return null;

    const [saved] = await db
      .update(capabilitySnapshots)
      .set({
        status: toDbCapabilityStatus(input.status),
        note: input.note ?? existing.note,
        source: "attestation",
        attestedBy: input.attestedBy,
        attestedAt: new Date(),
      })
      .where(eq(capabilitySnapshots.id, id))
      .returning();

    if (!saved) {
      throw new Error("Failed to persist capability attestation");
    }
    return toCapabilityDto(saved);
  }
}

export const facilitiesService = new FacilitiesService();
