import { db, patients, handoffs, eq, desc, and, or } from "@orion/db";
import type { NewPatient, Patient } from "@orion/db";

export class PatientsService {
  async getPatientsByFacility(facilityId: string): Promise<Patient[]> {
    return db
      .select()
      .from(patients)
      .where(eq(patients.createdByFacilityId, facilityId))
      .orderBy(desc(patients.createdAt));
  }

  async createPatient(
    facilityId: string,
    data: Omit<NewPatient, "createdByFacilityId" | "createdAt">
  ): Promise<{ patient: Patient; isDuplicate: boolean }> {
    if (data.idempotencyKey) {
      const existing = await db
        .select()
        .from(patients)
        .where(eq(patients.idempotencyKey, data.idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        const p = existing[0];
        if (p!.displayName !== data.displayName) {
          throw new Error("IDEMPOTENCY_CONFLICT");
        }
        return { patient: p!, isDuplicate: true };
      }
    }

    const [patient] = await db
      .insert(patients)
      .values({
        ...data,
        createdByFacilityId: facilityId,
      })
      .returning();

    if (!patient) {
      throw new Error("Failed to create patient");
    }

    return { patient, isDuplicate: false };
  }

  async getPatientByIdAndFacility(
    patientId: string,
    facilityId: string,
    userRole: string = "origin"
  ): Promise<Patient | null> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient) return null;

    if (userRole === "admin" || userRole === "supervisor") {
      return patient; // Admins and supervisors can see patients
    }

    if (patient.createdByFacilityId === facilityId) {
      return patient;
    }

    const [participant] = await db
      .select({ id: handoffs.id })
      .from(handoffs)
      .where(
        and(
          eq(handoffs.patientId, patientId),
          or(
            eq(handoffs.originFacilityId, facilityId),
            eq(handoffs.destinationFacilityId, facilityId),
            eq(handoffs.currentDestinationFacilityId, facilityId)
          )
        )
      )
      .limit(1);

    if (participant) {
      return patient;
    }

    return null;
  }
}

export const patientsService = new PatientsService();
