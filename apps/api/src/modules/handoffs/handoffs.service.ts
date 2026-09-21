import { db, handoffs, handoffEvents, outboxJobs, careEpisodes, assessments, patients, outcomes, followUps, eq, desc, and, or } from "@orion/db";
import type { Handoff, HandoffEvent } from "@orion/db";
import { evaluateProtocol, ANC_DANGER_PROTOCOL, ADULT_GENERAL_PROTOCOL } from "@orion/protocols";
import { assertTransition } from "@orion/domain";
import crypto from "crypto";

export class HandoffsService {
  /**
   * Retrieves a protocol definition by code
   */
  private getProtocol(code: string) {
    if (code === "anc_danger") return ANC_DANGER_PROTOCOL;
    if (code === "adult_general") return ADULT_GENERAL_PROTOCOL;
    return null;
  }

  private generatePublicCode(prefix = "HF"): string {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Unambiguous characters
    let result = `${prefix}-`;
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private canonicalize(obj: unknown): string {
    if (obj === null || typeof obj !== "object") {
      return String(obj);
    }
    if (Array.isArray(obj)) {
      return "[" + obj.map((item) => this.canonicalize(item)).join(",") + "]";
    }
    const record = obj as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return "{" + keys.map((key) => `"${key}":${this.canonicalize(record[key])}`).join(",") + "}";
  }

  /**
   * Creates a handoff transactionally. Handles idempotency.
   */
  async createHandoff(params: {
    id?: string;
    episodeId?: string;
    assessmentId?: string;
    patientId: string;
    protocolCode: string;
    packetJson: Record<string, unknown>;
    destinationFacilityId: string;
    originFacilityId: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<{ handoff: Handoff; isDuplicate: boolean }> {
    const {
      id,
      episodeId,
      assessmentId,
      patientId,
      protocolCode,
      packetJson,
      destinationFacilityId,
      originFacilityId,
      userId,
      idempotencyKey,
    } = params;

    // 1. Idempotency Check (Check if already exists)
    const existing = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      const handoff = existing[0];
      if (!handoff) throw new Error("IDEMPOTENCY_CONFLICT");
      
      // Request-Identity check: canonicalize before hashing
      const existingPayloadHash = crypto
        .createHash("sha256")
        .update(this.canonicalize({
          destinationFacilityId: handoff.destinationFacilityId,
          packetJson: handoff.packetJson,
          patientId: handoff.patientId,
          protocolCode: handoff.protocolCode,
        }))
        .digest("hex");

      const currentPayloadHash = crypto
        .createHash("sha256")
        .update(this.canonicalize({
          destinationFacilityId,
          packetJson,
          patientId,
          protocolCode,
        }))
        .digest("hex");

      if (existingPayloadHash !== currentPayloadHash) {
        throw new Error("IDEMPOTENCY_CONFLICT");
      }

      return { handoff, isDuplicate: true };
    }

    // 2. Validate Protocol & Re-evaluate Triage Server-Side
    const protocol = this.getProtocol(protocolCode);
    if (!protocol) {
      throw new Error("INVALID_PROTOCOL");
    }

    const triageResult = evaluateProtocol(protocol, packetJson);
    if (!triageResult.can_submit) {
      throw {
        message: "INCOMPLETE_PROTOCOL",
        missingFields: triageResult.completeness.missing,
      };
    }

    const urgency = triageResult.urgency;

    // 3. Transactional Creation with Retry for publicCode collisions
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      const handoffPublicCode = this.generatePublicCode("HF");
      const episodePublicCode = this.generatePublicCode("CE");

      try {
        const newHandoff = await db.transaction(async (tx) => {
          // 3a. Insert Care Episode
          const [insertedEpisode] = await tx
            .insert(careEpisodes)
            .values({
              ...(episodeId ? { id: episodeId } : {}),
              publicCode: episodePublicCode,
              patientId,
              openedByFacilityId: originFacilityId,
              status: "open",
            })
            .returning();

          if (!insertedEpisode) {
            throw new Error("Failed to insert care episode");
          }

          // 3b. Insert Assessment
          const [insertedAssessment] = await tx
            .insert(assessments)
            .values({
              ...(assessmentId ? { id: assessmentId } : {}),
              episodeId: insertedEpisode.id,
              protocolCode,
              answersJson: packetJson,
              triageJson: triageResult,
              assessedBy: userId,
            })
            .returning();

          if (!insertedAssessment) {
            throw new Error("Failed to insert assessment");
          }

          // 3c. Insert Handoff
          const [insertedHandoff] = await tx
            .insert(handoffs)
            .values({
              ...(id ? { id } : {}),
              publicCode: handoffPublicCode,
              episodeId: insertedEpisode.id,
              assessmentId: insertedAssessment.id,
              patientId,
              originFacilityId,
              destinationFacilityId,
              currentDestinationFacilityId: destinationFacilityId,
              protocolCode,
              urgency,
              state: "sent",
              packetJson, // kept for backward compatibility as per schema
              createdBy: userId,
              idempotencyKey,
            })
            .returning();

          if (!insertedHandoff) {
            throw new Error("Failed to insert handoff");
          }

          // Get Event Type via Domain state machine rules
          const eventType = assertTransition("draft", "sent");

          // Insert Event
          await tx
            .insert(handoffEvents)
            .values({
              handoffId: insertedHandoff.id,
              eventType,
              actorId: userId,
              payload: { message: "Referral created and sent to destination" },
            });

          // Insert Outbox Job (Mock SMS Notification)
          await tx
            .insert(outboxJobs)
            .values({
              jobType: "sms_notification",
              payload: {
                handoffId: insertedHandoff.id,
                message: `New ${urgency} referral ${handoffPublicCode} from your origin facility.`,
              },
            });

          return insertedHandoff;
        });

        return { handoff: newHandoff, isDuplicate: false };
      } catch (e: unknown) {
        const err = e as { code?: string; constraint?: string };
        // Unique constraint on idempotencyKey
        if (err.code === "23505" && err.constraint?.includes("idempotency_key")) {
          // Concurrent request won the race
          const [concurrentExisting] = await db
            .select()
            .from(handoffs)
            .where(eq(handoffs.idempotencyKey, idempotencyKey))
            .limit(1);
          
          if (!concurrentExisting) throw new Error("IDEMPOTENCY_CONFLICT");
          return { handoff: concurrentExisting, isDuplicate: true };
        }
        
        // Unique constraint on publicCode
        if (err.code === "23505" && err.constraint?.includes("public_code")) {
          if (attempts >= MAX_ATTEMPTS) {
            throw new Error("FAILED_TO_GENERATE_UNIQUE_CODE");
          }
          continue; // Retry loop
        }
        
        throw e;
      }
    }
    
    throw new Error("FAILED_TO_GENERATE_UNIQUE_CODE");
  }

  /**
   * Get Handoffs for a facility (Origin view)
   */
  async getHandoffsByFacility(facilityId: string, role?: string): Promise<Handoff[]> {
    if (role === "inbound") {
      const rows = await db
        .select({
          handoff: handoffs,
          patientName: patients.displayName,
        })
        .from(handoffs)
        .leftJoin(patients, eq(handoffs.patientId, patients.id))
        .where(
          and(
            eq(handoffs.currentDestinationFacilityId, facilityId),
            or(
              eq(handoffs.state, "sent"),
              eq(handoffs.state, "acknowledged"),
              eq(handoffs.state, "accepted"),
              eq(handoffs.state, "cannot_accept"),
              eq(handoffs.state, "redirected"),
              eq(handoffs.state, "arrived"),
              eq(handoffs.state, "in_care"),
              eq(handoffs.state, "outcome_recorded"),
              eq(handoffs.state, "no_show")
            )
          )
        )
        .orderBy(desc(handoffs.createdAt));
      return rows.map((r) => ({ ...r.handoff, patientName: r.patientName }));
    }

    const rows = await db
      .select({
        handoff: handoffs,
        patientName: patients.displayName,
      })
      .from(handoffs)
      .leftJoin(patients, eq(handoffs.patientId, patients.id))
      .where(
        or(
          eq(handoffs.originFacilityId, facilityId),
          eq(handoffs.currentDestinationFacilityId, facilityId)
        )
      )
      .orderBy(desc(handoffs.createdAt));
      
    return rows.map((r) => ({ ...r.handoff, patientName: r.patientName }));
  }

  /**
   * Get Handoff Detail with Events
   */
  async getHandoffDetail(
    handoffId: string
  ): Promise<{ handoff: Handoff & { patientName?: string; patientAge?: number; patientSex?: string }; events: HandoffEvent[]; outcome: any; followUp: any } | null> {
    const [row] = await db
      .select({
        handoff: handoffs,
        patientName: patients.displayName,
        patientAge: patients.age,
        patientSex: patients.sex,
      })
      .from(handoffs)
      .leftJoin(patients, eq(handoffs.patientId, patients.id))
      .where(eq(handoffs.id, handoffId))
      .limit(1);

    if (!row) return null;
    const handoff = { ...row.handoff, patientName: row.patientName ?? undefined, patientAge: row.patientAge ?? undefined, patientSex: row.patientSex ?? undefined };

    const events = await db
      .select()
      .from(handoffEvents)
      .where(eq(handoffEvents.handoffId, handoff.id))
      .orderBy(handoffEvents.createdAt);

    const [outcome] = await db.select().from(outcomes).where(eq(outcomes.handoffId, handoff.id)).limit(1);
    const [followUp] = await db.select().from(followUps).where(eq(followUps.handoffId, handoff.id)).limit(1);

    return { handoff, events, outcome: outcome || null, followUp: followUp || null };
  }
}

export const handoffsService = new HandoffsService();
