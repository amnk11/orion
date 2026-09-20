import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db, careEpisodes, assessments, handoffs, eq } from "@orion/db";

describe("Phase 3: Care Episodes & Assessments", () => {
  let originCookies: string[];
  let patientId: string;
  let destinationFacilityId: string;
  
  beforeAll(async () => {
    // 1. Login as origin
    const resOrigin = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: "cho.wadgaon@orion.local", password: "OrionDemoPass123!" });
    
    if (!resOrigin.headers["set-cookie"]) {
      throw new Error("Failed to login, no set-cookie header: " + JSON.stringify(resOrigin.body));
    }
    originCookies = resOrigin.headers["set-cookie"];

    // Get destination facility
    const facilitiesRes = await request(app).get("/api/v1/facilities").set("Cookie", originCookies);
    destinationFacilityId = facilitiesRes.body.data.find((f: any) => f.name.includes("Rajgurunagar")).id;

    // 2. Create a synthetic patient
    const resPatient = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", originCookies)
      .send({ displayName: "Test Patient Phase 3", age: 30, sex: "female" });
    
    patientId = resPatient.body.data.id;
  });

  const validPacket = {
    gestation_weeks: 30,
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 80,
    respiratory_rate: 16,
    temperature: 37,
    oxygen_saturation: 98,
    severe_bleeding: false,
    seizures: false,
    unresponsive: false,
    severe_pain: false,
  };

  const idempotencyKey = "phase3-test-" + Date.now();

  it("should return 400 with missing-field list for incomplete assessment", async () => {
    const incompletePacket = {
      systolic_bp: 120,
      diastolic_bp: 80,
      heart_rate: 80,
      respiratory_rate: 16,
      oxygen_saturation: 98,
      severe_bleeding: false,
      seizures: false,
      unresponsive: false,
      severe_pain: false,
    };

    const res = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", originCookies)
      .send({
        patientId,
        protocolCode: "anc_danger",
        destinationFacilityId,
        packetJson: incompletePacket,
        idempotencyKey: "incomplete-" + Date.now(),
      });

    expect(res.status).toBe(400);
    const body = res.body;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("INCOMPLETE_PROTOCOL");
    expect(body.error.missingFields).toBeDefined();
    expect(body.error.missingFields.length).toBeGreaterThan(0);
    expect(body.error.missingFields[0].field).toBe("gestation_weeks");
  });

  it("should create an episode, assessment, and handoff successfully for a valid assessment", async () => {
    const res = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", originCookies)
      .send({
        patientId,
        protocolCode: "anc_danger",
        destinationFacilityId,
        packetJson: validPacket,
        idempotencyKey, // Reused in the next test
      });

    expect(res.status).toBe(201);
    const body = res.body;
    expect(body.ok).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.episodeId).toBeDefined();
    expect(body.data.assessmentId).toBeDefined();
    expect(body.data.urgency).toBe("green");
    
    const episodeRows = await db.select().from(careEpisodes).where(eq(careEpisodes.id, body.data.episodeId));
    expect(episodeRows.length).toBe(1);
    expect(episodeRows[0].status).toBe("open");
    
    const assessmentRows = await db.select().from(assessments).where(eq(assessments.id, body.data.assessmentId));
    expect(assessmentRows.length).toBe(1);
    expect((assessmentRows[0].triageJson as any).can_submit).toBe(true);
  });

  it("should not create a duplicate episode for the same idempotency key", async () => {
    const res = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", originCookies)
      .send({
        patientId,
        protocolCode: "anc_danger",
        destinationFacilityId,
        packetJson: validPacket,
        idempotencyKey,
      });

    expect(res.status).toBe(200); // returns existing
    // Check that we didn't create a second episode for this specific patient + idempotency 
    // by ensuring there's only exactly 1 episode returned for this idempotency key
    const episodes = await db.select().from(careEpisodes).where(eq(careEpisodes.patientId, patientId));
    // It should just be the one we created in the previous test
    expect(episodes.length).toBe(1);
  });

  it("should retrieve episode detail via GET /api/v1/episodes/:id", async () => {
    // 1. Get episodeId from previous creation
    const handoffsRes = await request(app)
      .get("/api/v1/handoffs")
      .set("Cookie", originCookies);
    const episodeId = handoffsRes.body.data[0].episodeId;

    // 2. Fetch via new API
    const res = await request(app)
      .get(`/api/v1/episodes/${episodeId}`)
      .set("Cookie", originCookies);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.id).toBe(episodeId);
    expect(res.body.data.assessments).toBeDefined();
    expect(res.body.data.assessments.length).toBeGreaterThan(0);
    expect(res.body.data.handoffs).toBeDefined();
  });
});
