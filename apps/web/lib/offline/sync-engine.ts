import { db } from "./db";
import { connectivity } from "./connectivity";

const MAX_ATTEMPTS = 5;

class SyncEngine {
  private isSyncing = false;

  constructor() {
    // Start syncing when connection restores
    if (typeof window !== "undefined") {
      connectivity.subscribe((status) => {
        if (status === "online") {
          this.triggerSync();
        }
      });
      // Also check on load
      setTimeout(() => this.triggerSync(), 1000);
    }
  }

  public async triggerSync() {
    if (this.isSyncing || connectivity.status !== "online") return;
    this.isSyncing = true;

    try {
      await this.processQueue();
    } finally {
      this.isSyncing = false;
    }
  }

  private async processQueue() {
    // Get all pending or syncing mutations that are due to be attempted
    const now = Date.now();
    const pendingMutations = await db.mutationQueue
      .where("status")
      .anyOf("pending", "syncing")
      .filter((m) => m.nextAttemptAt <= now && m.attempts < MAX_ATTEMPTS)
      .sortBy("createdAt");

    if (pendingMutations.length === 0) return;

    // We process them one by one or in a batch.
    // The requirement says POST /api/v1/sync/batch
    
    // Group into a batch payload
    const payload = {
      mutations: pendingMutations.map((m) => ({
        clientMutationId: m.clientMutationId,
        mutationType: m.mutationType,
        payload: m.payload,
      }))
    };

    try {
      // Mark as syncing locally
      for (const m of pendingMutations) {
        await db.mutationQueue.update(m.id, { status: "syncing" });
        await db.localHandoffs.where("clientMutationId").equals(m.clientMutationId).modify({ syncStatus: "syncing" });
      }

      const res = await fetch("/api/v1/sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Auth error, do not aggressively retry. Needs user intervention.
          throw new Error("AUTH_ERROR");
        }
        throw new Error("HTTP_ERROR");
      }

      const data = await res.json();
      const results = data.data?.results || [];

      // Reconcile each result
      for (const result of results) {
        const mutationId = result.clientMutationId;
        const status = result.status; // 'applied' | 'duplicate' | 'rejected' | 'conflict'

        if (status === "applied" || status === "duplicate") {
          await db.mutationQueue.update(mutationId, { status: "synced" });
          await db.localHandoffs.where("clientMutationId").equals(mutationId).modify({ 
            syncStatus: "synced",
            serverId: result.serverId,
            publicCode: result.publicCode,
            syncedAt: new Date().toISOString()
          });
        } else if (status === "conflict") {
          await db.mutationQueue.update(mutationId, { status: "conflict", lastError: "Server reported conflict." });
          await db.localHandoffs.where("clientMutationId").equals(mutationId).modify({ syncStatus: "conflict" });
        } else {
          // rejected
          await db.mutationQueue.update(mutationId, { status: "failed", lastError: "Server rejected the mutation." });
          await db.localHandoffs.where("clientMutationId").equals(mutationId).modify({ syncStatus: "failed" });
        }
      }

    } catch (error: any) {
      // Backoff and retry
      for (const m of pendingMutations) {
        const isTerminal = error.message === "AUTH_ERROR";
        const attempts = isTerminal ? MAX_ATTEMPTS : m.attempts + 1;
        const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
        const backoffMs = Math.pow(2, attempts) * 1000;
        
        await db.mutationQueue.update(m.id, {
          status,
          attempts,
          nextAttemptAt: isTerminal ? Date.now() : Date.now() + backoffMs,
          lastError: error.message
        });

        if (status === "failed") {
          await db.localHandoffs.where("clientMutationId").equals(m.clientMutationId).modify({ syncStatus: "failed", errorDetails: error.message });
        } else {
          await db.localHandoffs.where("clientMutationId").equals(m.clientMutationId).modify({ syncStatus: "pending" });
        }
      }
    }
  }

  public async queueHandoffCreation(handoff: any) {
    const clientMutationId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Store in local handoffs
    await db.localHandoffs.add({
      id: handoff.id,
      clientMutationId,
      patientId: handoff.patientId,
      episodeId: handoff.episodeId,
      assessmentId: handoff.assessmentId,
      payload: {
        protocolCode: handoff.protocolCode,
        destinationFacilityId: handoff.destinationFacilityId,
        packetJson: handoff.packetJson,
      },
      syncStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Store in mutation queue
    await db.mutationQueue.add({
      id: clientMutationId, // we just use clientMutationId as the PK for mutation queue for simplicity
      clientMutationId,
      mutationType: "create_handoff",
      payload: {
        id: handoff.id,
        episodeId: handoff.episodeId,
        assessmentId: handoff.assessmentId,
        patientId: handoff.patientId,
        protocolCode: handoff.protocolCode,
        destinationFacilityId: handoff.destinationFacilityId,
        packetJson: handoff.packetJson,
        idempotencyKey: handoff.idempotencyKey,
      },
      status: "pending",
      attempts: 0,
      nextAttemptAt: Date.now(),
      createdAt: now,
      updatedAt: now,
    });

    // trigger immediately
    this.triggerSync();
    
    return clientMutationId;
  }
  public async queuePatientCreation(patient: any) {
    const clientMutationId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.mutationQueue.add({
      id: clientMutationId,
      clientMutationId,
      mutationType: "create_patient",
      payload: {
        id: patient.id,
        displayName: patient.displayName,
        age: patient.age,
        sex: patient.sex,
        idempotencyKey: patient.idempotencyKey,
      },
      status: "pending",
      attempts: 0,
      nextAttemptAt: Date.now(),
      createdAt: now,
      updatedAt: now,
    });

    this.triggerSync();
    return clientMutationId;
  }
}

export const syncEngine = new SyncEngine();
