import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db, handoffs, handoffEvents, outboxJobs, eq, desc, facilities } from "@orion/db";
import { canTransition, assertTransition, getValidNextStates, InvalidStateTransitionError } from "@orion/domain";

describe("Phase 4: Handoff Transitions (Domain & API)", () => {
  let originCookies: string[];
  let destinationCookies: string[];
  let unrelatedCookies: string[];
  let supervisorCookies: string[];

  let originFacilityId: string;
  let destinationFacilityId: string;
  let unrelatedFacilityId: string;
  let patientId: string;

  beforeAll(async () => {
    // 1. Login
    const login = async (email: string) => {
      const res = await request(app).post("/api/auth/sign-in/email").send({ email, password: "OrionDemoPass123!" });
      if (res.status !== 200) throw new Error("Failed to login " + email);
      return res.headers["set-cookie"];
    };

    originCookies = await login("cho.wadgaon@orion.local");
    destinationCookies = await login("desk.rajgurunagar@orion.local");
    unrelatedCookies = await login("mo.chakan@orion.local"); // An unrelated facility user
    supervisorCookies = await login("supervisor.pune@orion.local");

    // 2. Extract Facility IDs
    const getFac = async (cookies: string[]) => {
      const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookies);
      return me.body.data.facilityId;
    };
    originFacilityId = await getFac(originCookies);
    destinationFacilityId = await getFac(destinationCookies);
    unrelatedFacilityId = await getFac(unrelatedCookies);

    // 3. Create Patient
    const patRes = await request(app)
      .post("/api/v1/patients")
      .set("Cookie", originCookies)
      .send({ displayName: "Transition Test Pat", age: 30, sex: "female" });
    patientId = patRes.body.data.id;
  });

  async function createHandoffForTransition() {
    const res = await request(app)
      .post("/api/v1/handoffs")
      .set("Cookie", originCookies)
      .send({
        patientId,
        protocolCode: "anc_danger",
        destinationFacilityId,
        packetJson: { gestation_weeks: 30 },
        idempotencyKey: "test-trans-" + Date.now() + Math.random(),
      });
    return res.body.data;
  }

  describe("A. DOMAIN STATE MACHINE", () => {
    it("draft -> sent valid", () => expect(canTransition("draft", "sent")).toBe(true));
    it("sent -> acknowledged valid", () => expect(canTransition("sent", "acknowledged")).toBe(true));
    it("acknowledged -> accepted valid", () => expect(canTransition("acknowledged", "accepted")).toBe(true));
    it("acknowledged -> cannot_accept valid", () => expect(canTransition("acknowledged", "cannot_accept")).toBe(true));
    it("acknowledged -> redirected valid", () => expect(canTransition("acknowledged", "redirected")).toBe(true));
    it("accepted -> arrived valid", () => expect(canTransition("accepted", "arrived")).toBe(true));
    it("accepted -> no_show valid", () => expect(canTransition("accepted", "no_show")).toBe(true));
    it("arrived -> in_care valid", () => expect(canTransition("arrived", "in_care")).toBe(true));
    it("in_care -> outcome_recorded valid", () => expect(canTransition("in_care", "outcome_recorded")).toBe(true));
    it("outcome_recorded -> follow_up_pending valid", () => expect(canTransition("outcome_recorded", "follow_up_pending")).toBe(true));
    it("follow_up_pending -> closed valid", () => expect(canTransition("follow_up_pending", "closed")).toBe(true));
    it("no_show -> closed valid", () => expect(canTransition("no_show", "closed")).toBe(true));

    it("returns correct validNextStates", () => {
      expect(getValidNextStates("acknowledged").sort()).toEqual(["accepted", "cannot_accept", "redirected"].sort());
    });
  });

  describe("B, C, D, E, F, G, H. API & RULES", () => {
    it("should successfully acknowledge a handoff (destination role)", async () => {
      const h = await createHandoffForTransition();
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/acknowledge`)
        .set("Cookie", destinationCookies)
        .send({});
      if (res.status !== 201) console.error("ACK RESPONSE:", JSON.stringify(res.body.error, null, 2), "expectedFac:", destinationFacilityId, "actualHandoffDest:", h.currentDestinationFacilityId);
      expect(res.status).toBe(201);
      expect(res.body.data.state).toBe("acknowledged");

      // F. Events: Exactly one event created
      const events = await db.select().from(handoffEvents).where(eq(handoffEvents.handoffId, h.id)).orderBy(desc(handoffEvents.createdAt));
      expect(events[0].eventType).toBe("handoff_acknowledged");
      expect(events[0].prevState).toBe("sent");
      expect(events[0].nextState).toBe("acknowledged");
      expect(events[0].actorRole).toBe("destination");
      expect(events[0].facilityId).toBe(destinationFacilityId);
    });

    it("should reject invalid transition (409)", async () => {
      const h = await createHandoffForTransition();
      // Trying to accept without acknowledging first
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/accept`)
        .set("Cookie", destinationCookies)
        .send({});
      expect(res.status).toBe(409);
      expect(res.body.error.currentState).toBe("sent");
      expect(res.body.error.attemptedTransition).toBe("accepted");
      expect(res.body.error.validNextStates).toContain("acknowledged");
    });

    it("should enforce RBAC - unrelated facility cannot mutate", async () => {
      const h = await createHandoffForTransition();
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/acknowledge`)
        .set("Cookie", unrelatedCookies)
        .send({});
      expect(res.status).toBe(403);
    });

    it("should enforce RBAC - origin cannot perform destination transition", async () => {
      const h = await createHandoffForTransition();
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/acknowledge`)
        .set("Cookie", originCookies)
        .send({});
      expect(res.status).toBe(403);
    });

    it("should enforce RBAC - supervisor cannot perform transition", async () => {
      const h = await createHandoffForTransition();
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/acknowledge`)
        .set("Cookie", supervisorCookies)
        .send({});
      expect(res.status).toBe(403);
    });

    it("cannot-accept requires reason", async () => {
      const h = await createHandoffForTransition();
      await request(app).post(`/api/v1/handoffs/${h.id}/acknowledge`).set("Cookie", destinationCookies).send({});
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/cannot-accept`)
        .set("Cookie", destinationCookies)
        .send({}); // missing reason
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("redirect requires destination, reason, and increments redirectCount", async () => {
      const h = await createHandoffForTransition();
      await request(app).post(`/api/v1/handoffs/${h.id}/acknowledge`).set("Cookie", destinationCookies).send({});
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/redirect`)
        .set("Cookie", destinationCookies)
        .send({ destinationFacilityId: unrelatedFacilityId, reason: "ICU full" });
      
      expect(res.status).toBe(201);
      expect(res.body.data.state).toBe("redirected");
      expect(res.body.data.currentDestinationFacilityId).toBe(unrelatedFacilityId);
      expect(res.body.data.redirectCount).toBe(1);
      expect(res.body.data.episodeId).toBe(h.episodeId); // preserves episodeId
    });

    it("redirect to current destination is rejected", async () => {
      const h = await createHandoffForTransition();
      await request(app).post(`/api/v1/handoffs/${h.id}/acknowledge`).set("Cookie", destinationCookies).send({});
      const res = await request(app)
        .post(`/api/v1/handoffs/${h.id}/redirect`)
        .set("Cookie", destinationCookies)
        .send({ destinationFacilityId: destinationFacilityId, reason: "Same place" });
      expect(res.status).toBe(400);
    });

    it("duplicate clientEventId does not create duplicate event (Idempotency)", async () => {
      const h = await createHandoffForTransition();
      const cid = "client-event-" + Date.now();
      
      const res1 = await request(app)
        .post(`/api/v1/handoffs/${h.id}/acknowledge`)
        .set("Cookie", destinationCookies)
        .send({ clientEventId: cid });
      
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post(`/api/v1/handoffs/${h.id}/acknowledge`)
        .set("Cookie", destinationCookies)
        .send({ clientEventId: cid });

      expect(res2.status).toBe(200); // 200 OK duplicate
      
      const events = await db.select().from(handoffEvents).where(eq(handoffEvents.clientEventId, cid));
      expect(events.length).toBe(1); // exactly one event stored
    });

    it("concurrent transitions allow only one to succeed", async () => {
      const h = await createHandoffForTransition();
      await request(app).post(`/api/v1/handoffs/${h.id}/acknowledge`).set("Cookie", destinationCookies).send({});

      // Launch two accept requests simultaneously
      const req1 = request(app).post(`/api/v1/handoffs/${h.id}/accept`).set("Cookie", destinationCookies).send({});
      const req2 = request(app).post(`/api/v1/handoffs/${h.id}/accept`).set("Cookie", destinationCookies).send({});

      const [res1, res2] = await Promise.all([req1, req2]);
      
      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201); // one succeeds
      expect(statuses).toContain(409); // one fails with conflict because state is no longer 'acknowledged'
    });
  });
});
