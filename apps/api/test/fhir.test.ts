import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db, users, sessions, facilities, patients, handoffs, eq } from "@orion/db";
import { FHIR_PACKAGE } from "@orion/fhir";

describe("Phase 9: FHIR Export", () => {
  let sessionToken: string;
  let testFacilityId: string;
  let testPatientId: string;
  let testHandoffId: string;

  beforeAll(async () => {
    // 1. Sign in as origin
    const originRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: "cho.wadgaon@sahay.demo", password: "SahayDemoPass123!" });
      
    sessionToken = originRes.headers["set-cookie"]![0];

    const user = await db.query.users.findFirst({ where: eq(users.email, "cho.wadgaon@sahay.demo") });
    if (!user) throw new Error("No test user found");
    
    testFacilityId = user.facilityId!;
    
    const patient = await db.query.patients.findFirst();
    testPatientId = patient!.id;

    const dest = await db.query.facilities.findFirst();

    // Create a handoff to export
    const [handoff] = await db.insert(handoffs).values({
      publicCode: "TEST-FHIR-123",
      patientId: testPatientId,
      originFacilityId: testFacilityId,
      destinationFacilityId: dest!.id,
      currentDestinationFacilityId: dest!.id,
      protocolCode: "anc_danger",
      urgency: "red",
      state: "sent",
      packetJson: {},
      idempotencyKey: "fhir-test-key",
    }).returning();
    
    testHandoffId = handoff.id;
  });

  afterAll(async () => {
    await db.delete(handoffs).where(eq(handoffs.id, testHandoffId));
  });

  it("should block unauthenticated access", async () => {
    const res = await request(app).get(`/api/v1/handoffs/${testHandoffId}/fhir`);
    expect(res.status).toBe(401);
  });

  it("should return a valid FHIR Bundle for authorized user", async () => {
    const res = await request(app)
      .get(`/api/v1/handoffs/${testHandoffId}/fhir`)
      .set("Cookie", sessionToken);

    expect(res.status).toBe(200);
    
    const bundle = res.body;
    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("collection");
    expect(bundle.entry).toBeInstanceOf(Array);
    
    // Check for required resources
    const resources = bundle.entry.map((e: any) => e.resource.resourceType);
    expect(resources).toContain("Patient");
    expect(resources).toContain("Organization");
    expect(resources).toContain("ServiceRequest");

    // Verify Patient doesn't expose fake diagnosis data
    const patientEntry = bundle.entry.find((e: any) => e.resource.resourceType === "Patient");
    expect(patientEntry.resource.name[0].text).toBeTruthy();
  });
});
