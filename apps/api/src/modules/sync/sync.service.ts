import { handoffsService } from "../handoffs/handoffs.service";

export class SyncService {
  async processBatch(facilityId: string, userId: string, mutations: any[]) {
    const results = [];

    for (const mutation of mutations) {
      if (mutation.mutationType === "create_handoff") {
        try {
          const {
            id, episodeId, assessmentId, patientId, protocolCode, packetJson, destinationFacilityId, idempotencyKey
          } = mutation.payload;

          const { handoff, isDuplicate } = await handoffsService.createHandoff({
            id,
            episodeId,
            assessmentId,
            patientId,
            protocolCode,
            packetJson,
            destinationFacilityId,
            originFacilityId: facilityId,
            userId,
            idempotencyKey,
          });

          results.push({
            clientMutationId: mutation.clientMutationId,
            status: isDuplicate ? "duplicate" : "applied",
            serverId: handoff.id,
            publicCode: handoff.publicCode
          });
        } catch (error: any) {
          if (error.message === "IDEMPOTENCY_CONFLICT") {
            results.push({ clientMutationId: mutation.clientMutationId, status: "conflict" });
          } else {
            results.push({ clientMutationId: mutation.clientMutationId, status: "rejected", error: error.message });
          }
        }
      } else if (mutation.mutationType === "create_patient") {
        try {
          const { id, displayName, age, sex, idempotencyKey } = mutation.payload;
          const { patientsService } = await import("../patients/patients.service");
          
          const { patient, isDuplicate } = await patientsService.createPatient(facilityId, {
            id, displayName, age, sex, idempotencyKey
          });

          results.push({
            clientMutationId: mutation.clientMutationId,
            status: isDuplicate ? "duplicate" : "applied",
            serverId: patient.id
          });
        } catch (error: any) {
          if (error.message === "IDEMPOTENCY_CONFLICT") {
            results.push({ clientMutationId: mutation.clientMutationId, status: "conflict" });
          } else {
            results.push({ clientMutationId: mutation.clientMutationId, status: "rejected", error: error.message });
          }
        }
      }
    }

    return results;
  }
}

export const syncService = new SyncService();
