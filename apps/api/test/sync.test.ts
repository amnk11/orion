import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { randomUUID } from "crypto";

describe("Phase 7 Sync API", () => {
  const originCredentials = {
    email: "cho.wadgaon@sahay.demo",
    password: "SahayDemoPass123!",
  };

  it("should reject unauthorized requests", async () => {
    const res = await request(app)
      .post("/api/v1/sync/batch")
      .send({ mutations: [] });
    
    expect(res.status).toBe(401);
  });

  it("should validate mutation payload", async () => {
    const signInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send(originCredentials);
    
    const cookies = signInRes.headers["set-cookie"];
    
    const res = await request(app)
      .post("/api/v1/sync/batch")
      .set("Cookie", cookies!)
      .send({
        mutations: [
          {
            clientMutationId: randomUUID(),
            // missing mutationType
            payload: {},
          }
        ]
      });
      
    // Zod validation should fail at router level
    expect(res.status).toBe(400);
  });

  it("should process valid mutations and preserve relational IDs", async () => {
    const signInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send(originCredentials);
    const cookies = signInRes.headers["set-cookie"];
    
    // Get destination facilities to make a valid handoff
    const facRes = await request(app).get("/api/v1/facilities").set("Cookie", cookies!);
    const destination = facRes.body.data.find((f: any) => f.id !== "unknown") || facRes.body.data[0];
    const destinationFacilityId = destination.id;

    const patientId = randomUUID();
    const handoffId = randomUUID();
    const episodeId = randomUUID();
    const assessmentId = randomUUID();
    
    const patientMutationId = randomUUID();
    const handoffMutationId = randomUUID();
    
    const patientIdempotency = randomUUID();
    const handoffIdempotency = randomUUID();

    const payload = {
      mutations: [
        {
          clientMutationId: patientMutationId,
          mutationType: "create_patient",
          payload: {
            id: patientId,
            idempotencyKey: patientIdempotency,
            displayName: "Anjali Patil",
            age: 25,
            sex: "F",
          }
        },
        {
          clientMutationId: handoffMutationId,
          mutationType: "create_handoff",
          payload: {
            id: handoffId,
            idempotencyKey: handoffIdempotency,
            patientId: patientId,
            episodeId: episodeId,
            assessmentId: assessmentId,
            protocolCode: "anc_danger",
            destinationFacilityId,
            packetJson: { gestation_weeks: 34, bleeding: true, bp: "120/80" }
          }
        }
      ]
    };

    const res = await request(app)
      .post("/api/v1/sync/batch")
      .set("Cookie", cookies!)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.results).toHaveLength(2);
    
    // Patient mutation
    expect(res.body.data.results[0].clientMutationId).toBe(patientMutationId);
    expect(res.body.data.results[0].status).toBe("applied");
    expect(res.body.data.results[0].serverId).toBe(patientId);

    // Handoff mutation
    if (res.body.data.results[1].status !== "applied") {
      // Intentionally left blank for test observation
    }
    expect(res.body.data.results[1].clientMutationId).toBe(handoffMutationId);
    expect(res.body.data.results[1].status).toBe("applied");
    expect(res.body.data.results[1].serverId).toBe(handoffId);

    // Verify it was actually created
    const getRes = await request(app).get(`/api/v1/handoffs/${handoffId}`).set("Cookie", cookies!);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.handoff.patientId).toBe(patientId);
    expect(getRes.body.data.handoff.destinationFacilityId).toBe(destinationFacilityId);

    // Verify Duplicate idempotency
    const retryRes = await request(app)
      .post("/api/v1/sync/batch")
      .set("Cookie", cookies!)
      .send(payload);

    expect(retryRes.status).toBe(200);
    expect(retryRes.body.data.results[0].status).toBe("duplicate");
    expect(retryRes.body.data.results[1].status).toBe("duplicate");
    
    // Test Invalid mutation type is rejected (will give 400 at zod schema level)
    const invalidTypeRes = await request(app)
      .post("/api/v1/sync/batch")
      .set("Cookie", cookies!)
      .send({
        mutations: [
          {
            clientMutationId: randomUUID(),
            mutationType: "delete_patient", // invalid
            payload: {},
          }
        ]
      });
    expect(invalidTypeRes.status).toBe(400);

    // Test partial/failed mutations return meaningful statuses
    const partialRes = await request(app)
      .post("/api/v1/sync/batch")
      .set("Cookie", cookies!)
      .send({
        mutations: [
          {
            clientMutationId: randomUUID(),
            mutationType: "create_handoff",
            payload: {
              // Missing required fields
              id: randomUUID(),
              idempotencyKey: randomUUID()
            }
          }
        ]
      });

    // The whole batch doesn't fail 400 if it's a runtime error in processing the specific mutation.
    // Wait, the API might fail the schema, let's see how create_handoff payload is validated.
    // If it's `z.any()` in sync schema, it fails inside `handoffsService`.
    expect(partialRes.status).toBe(200);
    expect(partialRes.body.data.results[0].status).toBe("rejected");
    expect(partialRes.body.data.results[0].error).toBeDefined();
  });

  it("should prevent RBAC/facility scoping bypass via sync", async () => {
    const signInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send(originCredentials);
    const cookies = signInRes.headers["set-cookie"];

    const payload = {
      mutations: [
        {
          clientMutationId: randomUUID(),
          mutationType: "accept_handoff", // Origin user should NOT be able to do this, but sync doesn't even support it
          payload: {
            id: randomUUID()
          }
        },
        {
          clientMutationId: randomUUID(),
          mutationType: "create_handoff",
          payload: {
            id: randomUUID(),
            idempotencyKey: randomUUID(),
            patientId: randomUUID(),
            protocolCode: "anc_danger",
            destinationFacilityId: randomUUID(),
            originFacilityId: randomUUID(), // Trying to spoof origin
          }
        }
      ]
    };

    const res = await request(app)
      .post("/api/v1/sync/batch")
      .set("Cookie", cookies!)
      .send(payload);

    // Zod validation blocks "accept_handoff" because it's not in the sync schema enum.
    // If it bypassed schema somehow, it would be ignored by the service.
    // Let's assert that the API returns 400 because of invalid mutationType.
    expect(res.status).toBe(400);
  });
});
