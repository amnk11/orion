import { db, facilities, capabilities, eq, desc } from "@orion/db";
import type { Facility, Capability } from "@orion/db";

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
  async getCapabilitiesByFacility(facilityId: string): Promise<Capability[]> {
    // In PostgreSQL, to get the "latest" per serviceCode without complex subqueries in Drizzle,
    // we can select all for the facility, order by attestedAt desc, and filter in memory,
    // or use a generic select and reduce. Since capabilities count per facility is small,
    // memory reduction is efficient and clean.
    const allCaps = await db
      .select()
      .from(capabilities)
      .where(eq(capabilities.facilityId, facilityId))
      .orderBy(desc(capabilities.attestedAt));

    const latestPerService = new Map<string, Capability>();
    for (const cap of allCaps) {
      if (!latestPerService.has(cap.serviceCode)) {
        latestPerService.set(cap.serviceCode, cap);
      }
    }

    return Array.from(latestPerService.values());
  }
}

export const facilitiesService = new FacilitiesService();
