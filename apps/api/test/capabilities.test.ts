import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";

/**
 * Phase 8 — Capability snapshots: API, authorization, freshness.
 *
 * Runs against the seeded demo database (same convention as the other
 * API test suites). Mutations target the CHC `icu` service code and the
 * original seeded values are restored in afterAll so the demo scenario
 * (CHC functional_ot = UNAVAILABLE, DH functional_ot = AVAILABLE) stays
 * deterministic.
 */
describe("Phase 8 Capability Snapshots", () => {
  const originCho = { email: "cho.wadgaon@sahay.demo", password: "SahayDemoPass123!" };
  const destChc = { email: "desk.rajgurunagar@sahay.demo", password: "SahayDemoPass123!" };
  const destDh = { email: "desk.pune@sahay.demo", password: "SahayDemoPass123!" };
  const supervisor = { email: "supervisor.pune@sahay.demo", password: "SahayDemoPass123!" };

  let originCookies: string[];
  let chcCookies: string[];
  let dhCookies: string[];
  let supCookies: string[];

  let chcFacilityId: string;
  let dhFacilityId: string;

  async function signIn(creds: { email: string; password: string }) {
    const res = await request(app).post("/api/auth/sign-in/email").send(creds);
    expect(res.status).toBe(200);
    return res.headers["set-cookie"] as unknown as string[];
  }

  async function myFacilityId(cookies: string[]) {
    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookies);
    expect(me.status).toBe(200);
    return me.body.data.facilityId as string;
  }

  interface CapDto {
    id: string;
    serviceCode: string;
    serviceLabel: string;
    status: string;
    freshness: string;
    attestedAt: string | null;
    note: string | null;
  }

  async function getCaps(facilityId: string, cookies: string[]): Promise<CapDto[]> {
    const res = await request(app)
      .get(`/api/v1/facilities/${facilityId}/capabilities`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    return res.body.data as CapDto[];
  }

  beforeAll(async () => {
    originCookies = await signIn(originCho);
    chcCookies = await signIn(destChc);
    dhCookies = await signIn(destDh);
    supCookies = await signIn(supervisor);
    chcFacilityId = await myFacilityId(chcCookies);
    dhFacilityId = await myFacilityId(dhCookies);
  });

  afterAll(async () => {
    // Restore seeded demo values mutated by these tests.
    await request(app)
      .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
      .set("Cookie", chcCookies)
      .send({ serviceCode: "icu", status: "UNAVAILABLE", note: "Seed snapshot for CHC Rajgurunagar - icu" });
  });

  describe("GET /api/v1/facilities/:id/capabilities", () => {
    it("returns the latest capability snapshot per service code", async () => {
      const caps = await getCaps(chcFacilityId, chcCookies);
      expect(Array.isArray(caps)).toBe(true);
      expect(caps.length).toBeGreaterThan(0);

      const codes = caps.map((c) => c.serviceCode);
      expect(new Set(codes).size).toBe(codes.length); // one row per service code
      for (const cap of caps) {
        expect(["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]).toContain(cap.status);
        expect(["FRESH", "STALE", "VERY_STALE"]).toContain(cap.freshness);
        expect(cap.attestedAt).toBeTruthy();
      }
    });

    it("reflects the seeded demo scenario (CHC OT unavailable, DH OT available)", async () => {
      const chcCaps = await getCaps(chcFacilityId, chcCookies);
      const dhCaps = await getCaps(dhFacilityId, dhCookies);

      const chcOt = chcCaps.find((c) => c.serviceCode === "functional_ot");
      const dhOt = dhCaps.find((c) => c.serviceCode === "functional_ot");
      expect(chcOt?.status).toBe("UNAVAILABLE");
      expect(dhOt?.status).toBe("AVAILABLE");
    });

    it("marks very old attestations as VERY_STALE and fresh ones as FRESH", async () => {
      // Ensure 'lab' is freshly attested right now so the test doesn't flake if seed is old
      await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({ serviceCode: "lab", status: "AVAILABLE", note: "Refresh for test" });

      const caps = await getCaps(chcFacilityId, chcCookies);
      const obgyn = caps.find((c) => c.serviceCode === "obgyn"); // seeded 15 days ago
      const lab = caps.find((c) => c.serviceCode === "lab"); 
      expect(obgyn?.freshness).toBe("VERY_STALE");
      expect(obgyn?.status).toBe("AVAILABLE"); // status independent of freshness
      expect(lab?.freshness).toBe("FRESH");
    });

    it("requires authentication", async () => {
      const res = await request(app).get(`/api/v1/facilities/${chcFacilityId}/capabilities`);
      expect(res.status).toBe(401);
    });

    it("returns 404 for a non-existent facility", async () => {
      const res = await request(app)
        .get("/api/v1/facilities/00000000-0000-0000-0000-000000000000/capabilities")
        .set("Cookie", chcCookies);
      expect(res.status).toBe(404);
    });
  });
  describe("POST /api/v1/facilities/:id/capabilities", () => {
    it("allows a destination user to attest a capability for their own facility", async () => {
      const before = Date.now();
      const res = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({ serviceCode: "icu", status: "AVAILABLE", note: "ICU beds free today" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.serviceCode).toBe("icu");
      expect(res.body.data.status).toBe("AVAILABLE");
      expect(res.body.data.freshness).toBe("FRESH");
      expect(res.body.data.note).toBe("ICU beds free today");

      const attestedAt = new Date(res.body.data.attestedAt).getTime();
      expect(attestedAt).toBeGreaterThanOrEqual(before - 5000);
      expect(attestedAt).toBeLessThanOrEqual(Date.now() + 5000);
    });

    it("a newer attestation replaces the previous snapshot (latest wins)", async () => {
      const res = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({ serviceCode: "icu", status: "UNAVAILABLE", note: "ICU full" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("UNAVAILABLE");

      const caps = await getCaps(chcFacilityId, chcCookies);
      const icuRows = caps.filter((c) => c.serviceCode === "icu");
      expect(icuRows.length).toBe(1);
      expect(icuRows[0].status).toBe("UNAVAILABLE");
      expect(icuRows[0].note).toBe("ICU full");
      expect(icuRows[0].freshness).toBe("FRESH");
    });

    it("rejects cross-facility attestation (destination user -> other facility)", async () => {
      const res = await request(app)
        .post(`/api/v1/facilities/${dhFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({ serviceCode: "icu", status: "UNAVAILABLE" });
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    it("rejects origin/CHO users from modifying destination capability data", async () => {
      const res = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", originCookies)
        .send({ serviceCode: "icu", status: "AVAILABLE" });
      expect(res.status).toBe(403);
    });

    it("rejects unauthenticated attestation", async () => {
      const res = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .send({ serviceCode: "icu", status: "AVAILABLE" });
      expect(res.status).toBe(401);
    });

    it("validates the payload (status and serviceCode)", async () => {
      const badStatus = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({ serviceCode: "icu", status: "MAYBE" });
      expect(badStatus.status).toBe(400);
      expect(badStatus.body.error.code).toBe("VALIDATION_ERROR");

      const badService = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({ serviceCode: "helipad", status: "AVAILABLE" });
      expect(badService.status).toBe(400);
      expect(badService.body.error.code).toBe("VALIDATION_ERROR");

      const missing = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", chcCookies)
        .send({});
      expect(missing.status).toBe(400);
    });

    it("allows a supervisor to attest for their assigned facility only", async () => {
      // supervisor.pune is assigned to DH Pune
      const own = await request(app)
        .post(`/api/v1/facilities/${dhFacilityId}/capabilities`)
        .set("Cookie", supCookies)
        .send({ serviceCode: "lab", status: "AVAILABLE", note: "Supervisor verification" });
      expect(own.status).toBe(200);
      expect(own.body.data.freshness).toBe("FRESH");

      const cross = await request(app)
        .post(`/api/v1/facilities/${chcFacilityId}/capabilities`)
        .set("Cookie", supCookies)
        .send({ serviceCode: "lab", status: "AVAILABLE" });
      expect(cross.status).toBe(403);
    });
  });
  describe("PUT /api/v1/capabilities/:id", () => {
    it("re-attests an existing snapshot for the destination's own facility", async () => {
      const caps = await getCaps(chcFacilityId, chcCookies);
      const icu = caps.find((c) => c.serviceCode === "icu");
      expect(icu).toBeTruthy();

      const res = await request(app)
        .put(`/api/v1/capabilities/${icu!.id}`)
        .set("Cookie", chcCookies)
        .send({ status: "AVAILABLE", note: "Re-attested via PUT" });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(icu!.id);
      expect(res.body.data.status).toBe("AVAILABLE");
      expect(res.body.data.freshness).toBe("FRESH");
    });

    it("rejects cross-facility re-attestation", async () => {
      const dhCaps = await getCaps(dhFacilityId, dhCookies);
      const dhIcu = dhCaps.find((c) => c.serviceCode === "icu");
      expect(dhIcu).toBeTruthy();

      const res = await request(app)
        .put(`/api/v1/capabilities/${dhIcu!.id}`)
        .set("Cookie", chcCookies)
        .send({ status: "UNAVAILABLE" });
      expect(res.status).toBe(403);
    });

    it("rejects origin users", async () => {
      const caps = await getCaps(chcFacilityId, chcCookies);
      const icu = caps.find((c) => c.serviceCode === "icu");

      const res = await request(app)
        .put(`/api/v1/capabilities/${icu!.id}`)
        .set("Cookie", originCookies)
        .send({ status: "UNAVAILABLE" });
      expect(res.status).toBe(403);
    });

    it("returns 404 for an unknown snapshot id", async () => {
      const res = await request(app)
        .put("/api/v1/capabilities/00000000-0000-0000-0000-000000000000")
        .set("Cookie", chcCookies)
        .send({ status: "AVAILABLE" });
      expect(res.status).toBe(404);
    });

    it("validates the payload", async () => {
      const caps = await getCaps(chcFacilityId, chcCookies);
      const icu = caps.find((c) => c.serviceCode === "icu");

      const res = await request(app)
        .put(`/api/v1/capabilities/${icu!.id}`)
        .set("Cookie", chcCookies)
        .send({ status: "SOMETIMES" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
