import { db, patients, eq, desc } from "@orion/db";
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
   * Retrieves a specific patient, ensuring they belong to the requesting facility.
   */
  async getPatientByIdAndFacility(
    patientId: string,
    facilityId: string
  ): Promise<Patient | null> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient || patient.createdByFacilityId !== facilityId) {
      return null;
    }

    return patient;
  }
}

export const patientsService = new PatientsService();
