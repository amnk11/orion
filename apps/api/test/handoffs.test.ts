import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import crypto from "crypto";

describe("Phase 3 Handoffs API", () => {
  const originCredentials = {
    email: "cho.rampur@orion.local",
    password: "OrionDemoPass123!",
  };

  let cookies: string[];
  let validPatientId: string;
  let validDestinationId: string;

  beforeAll(async () => {
    // 1. Sign in
    const signInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send(originCredentials);
    
    if (signInRes.status === 200) {
      cookies = signInRes.headers["set-cookie"];
      
      // 2. Fetch a valid destination
      const facRes = await request(app).get("/api/v1/facilities").set("Cookie", cookies);
      validDestinationId = facRes.body.data.find((f: { type: string; id: string }) => f.type === "chc")?.id || facRes.body.data[0]?.id;

      // 3. Create a valid patient
      const patRes = await request(app)
        .post("/api/v1/patients")
        .set("Cookie", cookies)
        .send({ displayName: "Test Patient Idempotency", age: 30, sex: "female" });
      
      validPatientId = patRes.body.data.id;
    }
  });

  it("should enforce idempotency payload identity", async () => {
    if (!cookies) return; // skip if no seed DB

    const idempotencyKey = crypto.randomUUID();

    const payload1 = {
      patientId: validPatientId,
      protocolCode: "anc_danger",
      destinationFacilityId: validDestinationId,
      packetJson: { gestation_weeks: 34, bleeding: true, bp: "120/80" },
      idempotencyKey,
    };

    const payload2 = {
      ...payload1,
      packetJson: { gestation_weeks: 34, bleeding: false }, // different payload
    };

    // First request should succeed (201 Created)
    const res1 = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", cookies)
      .send(payload1);
    
    expect(res1.status).toBe(201);
    expect(res1.body.data.id).toBeDefined();
    
    // Second request with SAME payload should return 200 OK (existing)
    const res2 = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", cookies)
      .send(payload1);
      
    expect(res2.status).toBe(200);
    expect(res2.body.data.id).toBe(res1.body.data.id);

    // Third request with DIFFERENT payload should return 409 Conflict
    const res3 = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", cookies)
      .send(payload2);
      
    expect(res3.status).toBe(409);
    expect(res3.body.error.code).toBe("CONFLICT");
  });
});
