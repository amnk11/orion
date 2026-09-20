import { db, followUps, eq, and, sql, patients, handoffs } from "@orion/db";

export class FollowUpsService {
  async getFollowUpsByFacility(facilityId: string, status?: string) {
    let conditions = eq(followUps.facilityId, facilityId);
    if (status) {
      conditions = and(conditions, eq(followUps.status, status)) as any;
    }

    const rows = await db
      .select({
        followUp: followUps,
        patientName: patients.displayName,
        publicCode: handoffs.publicCode,
      })
      .from(followUps)
      .leftJoin(handoffs, eq(followUps.handoffId, handoffs.id))
      .leftJoin(patients, eq(handoffs.patientId, patients.id))
      .where(conditions)
      .orderBy(followUps.dueAt);

    return rows.map(r => ({
      ...r.followUp,
      patientName: r.patientName,
      publicCode: r.publicCode,
    }));
  }

  async completeFollowUp(followUpId: string, facilityId: string, userId: string, clientEventId?: string): Promise<{ followUp: any; isDuplicate: boolean }> {
    const existingRows = await db
      .select()
      .from(followUps)
      .where(and(eq(followUps.id, followUpId), eq(followUps.facilityId, facilityId)))
      .limit(1);

    if (existingRows.length === 0) {
      throw new Error("NOT_FOUND");
    }

    const fup = existingRows[0];

    if (fup!.status === "completed") {
      if (clientEventId && fup!.completedClientEventId === clientEventId) {
        return { followUp: fup, isDuplicate: true };
      }
      throw new Error("INVALID_STATE");
    }

    if (fup!.status !== "pending") {
      throw new Error("INVALID_STATE");
    }

    const [updated] = await db
      .update(followUps)
      .set({
        status: "completed",
        completedAt: sql`now()`,
        completedBy: userId,
        completedClientEventId: clientEventId || null,
        updatedAt: sql`now()`,
      })
      .where(eq(followUps.id, followUpId))
      .returning();

    return { followUp: updated, isDuplicate: false };
  }
}

export const followUpsService = new FollowUpsService();
