import { db, patients, handoffs, eq, desc, and, or } from "@orion/db";
import type { NewPatient, Patient } from "@orion/db";

export class PatientsService {
  /**
   * Retrieves patients created by the given facility.
   */
  async getPatientsByFacility(facilityId: string): Promise<Patient[]> {
    return db
      .select()
      .from(patients)
      .where(eq(patients.createdByFacilityId, facilityId))
      .orderBy(desc(patients.createdAt));
  }

  /**
   * Creates a new patient scoped to the authenticated user's facility.
   */
  async createPatient(
    facilityId: string,
    data: Omit<NewPatient, "createdByFacilityId" | "id" | "createdAt">
  ): Promise<Patient> {
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

    return patient;
  }

  /**
   * Retrieves a specific patient, ensuring they belong to the requesting facility
   * or the facility is a party to a handoff involving the patient.
   */
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

    // Check if the facility is party to any handoff for this patient
    // Note: We'd typically import handoffs here, but since it's a Drizzle model,
    // we can use it. Let's make sure it's imported at the top of the file.
    // I will dynamically add the handoffs import to this file later if not present.
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
