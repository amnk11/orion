import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db, facilities, patients, handoffs, eq } from "@orion/db";

describe("Phase 9: Public Status API", () => {
  let testHandoffId: string;
  let testPublicCode = "PUB-12345";

  beforeAll(async () => {
    const patient = await db.query.patients.findFirst();
    const origin = await db.query.facilities.findFirst();
    const dest = await db.query.facilities.findFirst();

    const [handoff] = await db.insert(handoffs).values({
      publicCode: testPublicCode,
      patientId: patient!.id,
      originFacilityId: origin!.id,
      destinationFacilityId: dest!.id,
      currentDestinationFacilityId: dest!.id,
      protocolCode: "anc_danger",
      urgency: "orange",
      state: "redirected",
      packetJson: {},
      idempotencyKey: "status-test-key",
    }).returning();
    
    testHandoffId = handoff.id;
  });

  afterAll(async () => {
    await db.delete(handoffs).where(eq(handoffs.id, testHandoffId));
  });

  it("should return public status without authentication", async () => {
    const res = await request(app).get(`/api/v1/public/status/${testPublicCode}`);
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    
    const data = res.body.data;
    expect(data.publicCode).toBe(testPublicCode);
    expect(data.state).toBe("redirected");
    expect(data.urgency).toBe("orange");
    expect(data.destinationName).toBeTruthy();
    
    // VERIFY ZERO PHI
    expect(data.patientId).toBeUndefined();
    expect(data.patientName).toBeUndefined();
    expect(data.diagnosis).toBeUndefined();
    expect(data.packetJson).toBeUndefined();
  });

  it("should return 404 for invalid public code", async () => {
    const res = await request(app).get(`/api/v1/public/status/INVALID_CODE`);
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe("Referral status unavailable");
  });
});
