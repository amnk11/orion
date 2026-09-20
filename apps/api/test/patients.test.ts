import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Phase 3 Patients API", () => {
  const originCredentials = {
    email: "cho.wadgaon@orion.local",
    password: "OrionDemoPass123!",
  };

  const destinationCredentials = {
    email: "desk.rajgurunagar@orion.local",
    password: "OrionDemoPass123!",
  };

  describe("Authentication & RBAC", () => {
    it("should return 401 for unauthenticated access", async () => {
      const res = await request(app).get("/api/v1/patients");
      expect(res.status).toBe(401);
    });

    it("should allow origin user to access patients", async () => {
      // 1. Sign in
      const signInRes = await request(app)
        .post("/api/auth/sign-in/email")
        .send(originCredentials);
      
      // If DB is offline in test run, this test will correctly fail to connect, 
      // but the structure is correct.
      expect(signInRes.status).toBe(200);
      const cookies = signInRes.headers["set-cookie"];
      const res = await request(app)
        .get("/api/v1/patients")
        .set("Cookie", cookies!);
      
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should deny destination user from creating a patient", async () => {
      const signInRes = await request(app)
        .post("/api/auth/sign-in/email")
        .send(destinationCredentials);
      
      expect(signInRes.status).toBe(200);
      const cookies = signInRes.headers["set-cookie"];
      const res = await request(app)
        .post("/api/v1/patients")
        .set("Cookie", cookies!)
        .send({ displayName: "Test Patient" });
      
      expect(res.status).toBe(403);
    });
  });

  describe("Idempotency & Client IDs", () => {
    it("should create patient with client ID and respect idempotency", async () => {
      const signInRes = await request(app)
        .post("/api/auth/sign-in/email")
        .send(originCredentials);
      const cookies = signInRes.headers["set-cookie"];

      const clientId = crypto.randomUUID();
      const idempotencyKey = "test-idem-" + Date.now();

      // A. First request -> creates patient
      const res1 = await request(app)
        .post("/api/v1/patients")
        .set("Cookie", cookies!)
        .send({
          id: clientId,
          displayName: "Idempotent Patient",
          idempotencyKey,
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.id).toBe(clientId);

      // B. Same idempotency key -> returns existing safely
      const res2 = await request(app)
        .post("/api/v1/patients")
        .set("Cookie", cookies!)
        .send({
          id: clientId,
          displayName: "Idempotent Patient",
          idempotencyKey,
        });

      expect(res2.status).toBe(200); // 200 instead of 201 for duplicate
      expect(res2.body.data.id).toBe(clientId);

      // E. Different idempotency key with DIFFERENT payload works normally
      const res3 = await request(app)
        .post("/api/v1/patients")
        .set("Cookie", cookies!)
        .send({
          displayName: "Another Patient",
          idempotencyKey: "test-idem-other-" + Date.now(),
        });

      expect(res3.status).toBe(201);
    });
  });
});
