import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Phase 3 Facilities API", () => {
  const originCredentials = {
    email: "cho.wadgaon@sahay.demo",
    password: "SahayDemoPass123!",
  };

  it("should retrieve facilities for authenticated user", async () => {
    const signInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send(originCredentials);
    
    expect(signInRes.status).toBe(200);
    const cookies = signInRes.headers["set-cookie"];
    const res = await request(app)
      .get("/api/v1/facilities")
      .set("Cookie", cookies!);
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should retrieve capabilities for a specific facility", async () => {
    const signInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send(originCredentials);
    
    expect(signInRes.status).toBe(200);
    const cookies = signInRes.headers["set-cookie"];
    
    // Get first facility
    const facRes = await request(app)
      .get("/api/v1/facilities")
      .set("Cookie", cookies!);
    
    const facilityId = facRes.body.data?.[0]?.id;
    if (facilityId) {
      const getRes = await request(app)
        .get(`/api/v1/facilities/${facilityId}`)
        .set("Cookie", cookies!);
        
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(facilityId);

      const capsRes = await request(app)
        .get(`/api/v1/facilities/${facilityId}/capabilities`)
        .set("Cookie", cookies!);
      
      expect(capsRes.status).toBe(200);
      expect(Array.isArray(capsRes.body.data)).toBe(true);
    }
  });
});
