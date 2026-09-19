import { describe, it, expect } from "vitest";
import {
  canTransition,
  getValidNextStates,
  getEventForTransition,
  assertTransition,
  InvalidStateTransitionError,
} from "../handoff-state-machine.js";

describe("Handoff State Machine", () => {
  it("should allow draft -> sent", () => {
    expect(canTransition("draft", "sent")).toBe(true);
    expect(getEventForTransition("draft", "sent")).toBe("handoff_sent");
  });

  it("should allow valid transitions from sent", () => {
    expect(canTransition("sent", "acknowledged")).toBe(true);
    expect(getEventForTransition("sent", "acknowledged")).toBe("handoff_acknowledged");
  });

  it("should allow valid transitions from acknowledged", () => {
    expect(canTransition("acknowledged", "accepted")).toBe(true);
    expect(canTransition("acknowledged", "cannot_accept")).toBe(true);
    expect(canTransition("acknowledged", "redirected")).toBe(true);

    expect(getEventForTransition("acknowledged", "accepted")).toBe("handoff_accepted");
    expect(getEventForTransition("acknowledged", "cannot_accept")).toBe("handoff_cannot_accept");
    expect(getEventForTransition("acknowledged", "redirected")).toBe("handoff_redirected");
  });

  it("should allow redirected -> sent", () => {
    expect(canTransition("redirected", "sent")).toBe(true);
    expect(getEventForTransition("redirected", "sent")).toBe("handoff_sent");
  });

  it("should allow valid transitions from accepted", () => {
    expect(canTransition("accepted", "arrived")).toBe(true);
    expect(canTransition("accepted", "no_show")).toBe(true);

    expect(getEventForTransition("accepted", "arrived")).toBe("patient_arrived");
    expect(getEventForTransition("accepted", "no_show")).toBe("patient_no_show");
  });

  it("should allow arrived -> in_care", () => {
    expect(canTransition("arrived", "in_care")).toBe(true);
    expect(getEventForTransition("arrived", "in_care")).toBe("care_started");
  });

  it("should allow in_care -> outcome_recorded", () => {
    expect(canTransition("in_care", "outcome_recorded")).toBe(true);
    expect(getEventForTransition("in_care", "outcome_recorded")).toBe("outcome_recorded");
  });

  it("should allow outcome_recorded -> follow_up_pending", () => {
    expect(canTransition("outcome_recorded", "follow_up_pending")).toBe(true);
    expect(getEventForTransition("outcome_recorded", "follow_up_pending")).toBe(
      "follow_up_created",
    );
  });

  it("should allow transition to closed", () => {
    expect(canTransition("follow_up_pending", "closed")).toBe(true);
    expect(canTransition("no_show", "closed")).toBe(true);
    expect(canTransition("cannot_accept", "closed")).toBe(true);

    expect(getEventForTransition("follow_up_pending", "closed")).toBe("episode_closed");
    expect(getEventForTransition("no_show", "closed")).toBe("handoff_closed");
    expect(getEventForTransition("cannot_accept", "closed")).toBe("handoff_closed");
  });

  it("should reject invalid transitions", () => {
    expect(canTransition("draft", "accepted")).toBe(false);
    expect(canTransition("draft", "arrived")).toBe(false);
    expect(canTransition("sent", "arrived")).toBe(false);
    expect(canTransition("accepted", "redirected")).toBe(false);
    expect(canTransition("closed", "sent")).toBe(false);
    expect(canTransition("closed", "accepted")).toBe(false);
  });

  it("assertTransition should return event on success", () => {
    expect(assertTransition("draft", "sent")).toBe("handoff_sent");
    expect(assertTransition("sent", "acknowledged")).toBe("handoff_acknowledged");
  });

  it("assertTransition should throw InvalidStateTransitionError on invalid transition", () => {
    expect(() => assertTransition("draft", "accepted")).toThrowError(InvalidStateTransitionError);
    expect(() => assertTransition("closed", "sent")).toThrowError(InvalidStateTransitionError);

    try {
      assertTransition("draft", "accepted");
    } catch (e: any) {
      expect(e).toBeInstanceOf(InvalidStateTransitionError);
      expect(e.from).toBe("draft");
      expect(e.to).toBe("accepted");
      expect(e.message).toContain("Invalid transition from 'draft' to 'accepted'");
    }
  });

  it("getValidNextStates should return array of allowed states", () => {
    expect(getValidNextStates("draft")).toEqual(["sent"]);

    const ackNext = getValidNextStates("acknowledged");
    expect(ackNext).toContain("accepted");
    expect(ackNext).toContain("cannot_accept");
    expect(ackNext).toContain("redirected");
    expect(ackNext.length).toBe(3);

    expect(getValidNextStates("closed")).toEqual([]);
  });
});
