import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Phase 1 Authentication & Authorization", () => {
  const originCredentials = {
    email: "cho.wadgaon@orion.local",
    password: "OrionDemoPass123!",
  };

  const destinationCredentials = {
    email: "desk.rajgurunagar@orion.local",
    password: "OrionDemoPass123!",
  };

  describe("Unauthenticated Access", () => {
    it("should return HTTP 401 for GET /api/v1/auth/me without a session", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return HTTP 401 for GET /api/v1/auth/origin-test without a session", async () => {
      const res = await request(app).get("/api/v1/auth/origin-test");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Better Auth Sign In & Session Handling", () => {
    it("should reject sign in with invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/sign-in/email")
        .send({
          email: originCredentials.email,
          password: "WrongPassword999!",
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should sign in origin user, set session cookie, and return user profile", async () => {
      // 1. Sign in
      const signInRes = await request(app)
        .post("/api/auth/sign-in/email")
        .send(originCredentials);

      expect(signInRes.status).toBe(200);
      const cookies = signInRes.headers["set-cookie"];
      expect(cookies).toBeDefined();

      // 2. Request profile using session cookie
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", cookies);

      expect(meRes.status).toBe(200);
      expect(meRes.body.ok).toBe(true);
      expect(meRes.body.data).toMatchObject({
        email: originCredentials.email,
        role: "origin",
      });
      expect(meRes.body.data.userId).toBeDefined();
      expect(meRes.body.data.facilityId).toBeDefined();
    });

    it("should enforce role-based access control (origin allowed, destination forbidden)", async () => {
      // Sign in as origin
      const originSignIn = await request(app)
        .post("/api/auth/sign-in/email")
        .send(originCredentials);
      const originCookies = originSignIn.headers["set-cookie"];

      // Origin accessing origin-test -> 200
      const originAllowedRes = await request(app)
        .get("/api/v1/auth/origin-test")
        .set("Cookie", originCookies);
      expect(originAllowedRes.status).toBe(200);
      expect(originAllowedRes.body.ok).toBe(true);

      // Origin accessing destination-test -> 403 Forbidden
      const originForbiddenRes = await request(app)
        .get("/api/v1/auth/destination-test")
        .set("Cookie", originCookies);
      expect(originForbiddenRes.status).toBe(403);
      expect(originForbiddenRes.body.ok).toBe(false);
      expect(originForbiddenRes.body.error.code).toBe("FORBIDDEN");
    });

    it("should enforce role-based access control for destination user", async () => {
      // Sign in as destination
      const destSignIn = await request(app)
        .post("/api/auth/sign-in/email")
        .send(destinationCredentials);
      const destCookies = destSignIn.headers["set-cookie"];

      // Destination accessing destination-test -> 200
      const destAllowedRes = await request(app)
        .get("/api/v1/auth/destination-test")
        .set("Cookie", destCookies);
      expect(destAllowedRes.status).toBe(200);

      // Destination accessing origin-test -> 403
      const destForbiddenRes = await request(app)
        .get("/api/v1/auth/origin-test")
        .set("Cookie", destCookies);
      expect(destForbiddenRes.status).toBe(403);
      expect(destForbiddenRes.body.error.code).toBe("FORBIDDEN");
    });

    it("should invalidate session on sign out", async () => {
      // Sign in
      const signInRes = await request(app)
        .post("/api/auth/sign-in/email")
        .send(originCredentials);
      const cookies = signInRes.headers["set-cookie"];

      // Sign out
      const signOutRes = await request(app)
        .post("/api/auth/sign-out")
        .set("Cookie", cookies);
      expect(signOutRes.status).toBe(200);

      // Verify session is invalidated
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", cookies);
      expect(meRes.status).toBe(401);
    });
  });
});
