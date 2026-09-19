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
    expect(canTransition("sent", "accepted")).toBe(true);
    expect(canTransition("sent", "cannot_accept")).toBe(true);
    expect(canTransition("sent", "redirected")).toBe(true);
    
    expect(getEventForTransition("sent", "accepted")).toBe("handoff_accepted");
    expect(getEventForTransition("sent", "cannot_accept")).toBe("handoff_cannot_accept");
    expect(getEventForTransition("sent", "redirected")).toBe("handoff_redirected");
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

  it("should allow arrived -> return_noted", () => {
    expect(canTransition("arrived", "return_noted")).toBe(true);
    expect(getEventForTransition("arrived", "return_noted")).toBe("return_note_added");
  });

  it("should allow transition to closed", () => {
    expect(canTransition("return_noted", "closed")).toBe(true);
    expect(canTransition("no_show", "closed")).toBe(true);
    expect(canTransition("cannot_accept", "closed")).toBe(true);
    
    expect(getEventForTransition("return_noted", "closed")).toBe("handoff_closed");
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
    expect(assertTransition("sent", "accepted")).toBe("handoff_accepted");
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
    
    const sentNext = getValidNextStates("sent");
    expect(sentNext).toContain("accepted");
    expect(sentNext).toContain("cannot_accept");
    expect(sentNext).toContain("redirected");
    expect(sentNext.length).toBe(3);

    expect(getValidNextStates("closed")).toEqual([]);
  });
});
