import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Phase 2 Authorization & Scoping", () => {
  // Demo users from the Maharashtra seed
  const originAWadgaon = { email: "cho.rampur@orion.local", password: "OrionDemoPass123!" };
  const originBChakan = { email: "mo.beta@orion.local", password: "OrionDemoPass123!" };
  const destinationNorthBlock = { email: "desk.chcnorth@orion.local", password: "OrionDemoPass123!" };
  const supervisorPune = { email: "supervisor.central@orion.local", password: "OrionDemoPass123!" };

  let cookiesA: string[];
  let cookiesB: string[];
  let cookiesDest: string[];
  let cookiesSup: string[];

  let patientIdA: string;
  let handoffIdA: string;
  let destFacilityId: string;

  beforeAll(async () => {
    // 1. Sign in all users
    const resA = await request(app).post("/api/auth/sign-in/email").send(originAWadgaon);
    cookiesA = resA.headers["set-cookie"];

    const resB = await request(app).post("/api/auth/sign-in/email").send(originBChakan);
    cookiesB = resB.headers["set-cookie"];

    const resDest = await request(app).post("/api/auth/sign-in/email").send(destinationNorthBlock);
    cookiesDest = resDest.headers["set-cookie"];

    const resSup = await request(app).post("/api/auth/sign-in/email").send(supervisorPune);
    cookiesSup = resSup.headers["set-cookie"];

    // 2. Get destination facility ID
    const meDest = await request(app).get("/api/v1/auth/me").set("Cookie", cookiesDest);
    destFacilityId = meDest.body.data.facilityId;

    // 3. Facility A creates a patient
    const patRes = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", cookiesA)
      .send({ displayName: "Auth Test Patient", age: 25, sex: "female" });
    patientIdA = patRes.body.data.id;

    // 4. Facility A creates a handoff to Destination
    const hfRes = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", cookiesA)
      .send({
        patientId: patientIdA,
        protocolCode: "anc_danger",
        destinationFacilityId: destFacilityId,
        packetJson: { gestation_weeks: 34, bleeding: true, bp: "120/80" },
        idempotencyKey: "auth-test-handoff-2-" + Date.now()
      });
    
    if (!hfRes.body.ok) {
      throw new Error("Failed to create handoff: " + JSON.stringify(hfRes.body));
    }
    handoffIdA = hfRes.body.data.id;
  });

  describe("Facility Isolation: Patients", () => {
    it("Facility A can access its own patient", async () => {
      const res = await request(app).get(`/api/v1/patients/${patientIdA}`).set("Cookie", cookiesA);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(patientIdA);
    });

    it("Unrelated Facility B cannot access Facility A patient", async () => {
      const res = await request(app).get(`/api/v1/patients/${patientIdA}`).set("Cookie", cookiesB);
      expect(res.status).toBe(404);
    });

    it("Destination can access patient because it is a party to the handoff", async () => {
      const res = await request(app).get(`/api/v1/patients/${patientIdA}`).set("Cookie", cookiesDest);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(patientIdA);
    });
  });

  describe("Facility Isolation: Handoffs", () => {
    it("Origin A can access its own outbound handoff", async () => {
      const res = await request(app).get(`/api/v1/handoffs/${handoffIdA}`).set("Cookie", cookiesA);
      expect(res.status).toBe(200);
      expect(res.body.data.handoff.id).toBe(handoffIdA);
    });

    it("Destination can access its inbound handoff", async () => {
      const res = await request(app).get(`/api/v1/handoffs/${handoffIdA}`).set("Cookie", cookiesDest);
      expect(res.status).toBe(200);
      expect(res.body.data.handoff.id).toBe(handoffIdA);
    });

    it("Unrelated Facility B cannot access Facility A handoff", async () => {
      const res = await request(app).get(`/api/v1/handoffs/${handoffIdA}`).set("Cookie", cookiesB);
      expect(res.status).toBe(404);
    });
  });

  describe("Role Authorization", () => {
    it("Destination cannot create a handoff (origin-only)", async () => {
      const res = await request(app)
        .post("/api/v1/handoffs")
        .set("Cookie", cookiesDest)
        .send({
          patientId: patientIdA,
          protocolCode: "anc_danger",
          destinationFacilityId: destFacilityId,
          packetJson: {},
          idempotencyKey: "dest-create-fail-" + Date.now()
        });
      expect(res.status).toBe(403);
    });

    it("Supervisor cannot create a patient (origin-only)", async () => {
      const res = await request(app)
        .post("/api/v1/patients")
        .set("Cookie", cookiesSup)
        .send({ displayName: "Sup Patient" });
      expect(res.status).toBe(403);
    });
  });
});
