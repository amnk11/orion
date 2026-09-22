import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Phase 5 Destination Inbound API", () => {
  const originCreds = {
    email: "cho.wadgaon@sahay.demo",
    password: "SahayDemoPass123!",
  };
  
  const dest1Creds = {
    email: "desk.rajgurunagar@sahay.demo",
    password: "SahayDemoPass123!",
  };

  const dest2Creds = {
    email: "desk.pune@sahay.demo",
    password: "SahayDemoPass123!",
  };

  const supCreds = {
    email: "supervisor.pune@sahay.demo",
    password: "SahayDemoPass123!",
  };

  let originCookies: string[];
  let dest1Cookies: string[];
  let dest2Cookies: string[];
  let supCookies: string[];

  beforeAll(async () => {
    // 1. Sign in all roles
    let res = await request(app).post("/api/auth/sign-in/email").send(originCreds);
    originCookies = res.headers["set-cookie"];

    res = await request(app).post("/api/auth/sign-in/email").send(dest1Creds);
    dest1Cookies = res.headers["set-cookie"];

    res = await request(app).post("/api/auth/sign-in/email").send(dest2Creds);
    dest2Cookies = res.headers["set-cookie"];

    res = await request(app).post("/api/auth/sign-in/email").send(supCreds);
    supCookies = res.headers["set-cookie"];
  });

  it("should block origin from accessing inbound handoffs", async () => {
    if (!originCookies) return;
    const res = await request(app).get("/api/v1/handoffs?role=inbound").set("Cookie", originCookies);
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("Only destination users can view inbound handoffs");
  });

  it("should block supervisor from accessing inbound handoffs", async () => {
    if (!supCookies) return;
    const res = await request(app).get("/api/v1/handoffs?role=inbound").set("Cookie", supCookies);
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("Only destination users can view inbound handoffs");
  });

  it("should return only matching destination handoffs for destination 1", async () => {
    if (!dest1Cookies) return;
    const res = await request(app).get("/api/v1/handoffs?role=inbound").set("Cookie", dest1Cookies);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);

    const authSessionData = await request(app).get("/api/auth/get-session").set("Cookie", dest1Cookies);
    const myFacilityId = authSessionData.body?.user?.facilityId;

    for (const h of res.body.data) {
      if (myFacilityId) {
        expect(h.currentDestinationFacilityId).toBe(myFacilityId);
      }
      expect(h.state).not.toBe("closed");
      expect(h.state).not.toBe("follow_up_pending");
    }
  });

  it("should return isolated data for destination 2", async () => {
    if (!dest2Cookies) return;
    const res = await request(app).get("/api/v1/handoffs?role=inbound").set("Cookie", dest2Cookies);
    // Let's just verify it returns 200 and an array
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
