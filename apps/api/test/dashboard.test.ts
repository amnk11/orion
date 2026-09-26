import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db, users, sessions, facilities, eq } from "@orion/db";

describe("Phase 9: Dashboard API", () => {
  let sessionToken: string;
  let originToken: string;

  beforeAll(async () => {
    // 1. Sign in as supervisor
    const supRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: "supervisor.pune@sahay.demo", password: "SahayDemoPass123!" });

    // BUG-18 FIX: Assert login success before accessing the cookie — gives a clear
    // failure message when seed data or env configuration is wrong.
    expect(supRes.status).toBe(200);
    sessionToken = supRes.headers["set-cookie"]![0];

    // 2. Sign in as origin
    const originRes = await request(app)
      .post("/api/auth/sign-in/email")
      .send({ email: "cho.wadgaon@sahay.demo", password: "SahayDemoPass123!" });

    expect(originRes.status).toBe(200);
    originToken = originRes.headers["set-cookie"]![0];
  });

  it("should block non-supervisor access", async () => {
    const res = await request(app)
      .get(`/api/v1/dashboard/summary`)
      .set("Cookie", originToken);
    expect([401, 403]).toContain(res.status);
  });

  it("should return valid aggregated metrics for supervisor", async () => {
    const res = await request(app)
      .get(`/api/v1/dashboard/summary`)
      .set("Cookie", sessionToken);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    
    const data = res.body.data;
    
    expect(data.stateCounts).toBeDefined();
    expect(typeof data.stateCounts.pending).toBe("number");
    
    expect(data.ageing).toBeDefined();
    expect(typeof data.ageing["<1h"]).toBe("number");
    
    expect(data.redirectReasons).toBeDefined();
    
    expect(typeof data.noShowRate).toBe("number");
    expect(typeof data.outcomeRate).toBe("number");
    
    expect(data.followUps).toBeDefined();
    expect(typeof data.followUps.total).toBe("number");
    
    expect(data.capabilityFreshness).toBeDefined();
    expect(typeof data.capabilityFreshness.FRESH).toBe("number");
  });
});
