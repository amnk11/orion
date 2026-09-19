import { EventType, HandoffState } from "./handoff.types.js";

export class InvalidStateTransitionError extends Error {
  constructor(public from: HandoffState, public to: HandoffState) {
    super(`Invalid transition from '${from}' to '${to}'`);
    this.name = "InvalidStateTransitionError";
  }
}

type StateTransitions = {
  [from in HandoffState]?: {
    [to in HandoffState]?: EventType;
  };
};

// Map of allowed transitions: from -> to -> resulting event
const TRANSITIONS: StateTransitions = {
  draft: {
    sent: "handoff_sent",
  },
  sent: {
    accepted: "handoff_accepted",
    cannot_accept: "handoff_cannot_accept",
    redirected: "handoff_redirected",
  },
  redirected: {
    sent: "handoff_sent",
  },
  accepted: {
    arrived: "patient_arrived",
    no_show: "patient_no_show",
  },
  arrived: {
    return_noted: "return_note_added",
  },
  return_noted: {
    closed: "handoff_closed",
  },
  no_show: {
    closed: "handoff_closed",
  },
  cannot_accept: {
    closed: "handoff_closed",
  },
  closed: {}, // terminal
};

export function canTransition(from: HandoffState, to: HandoffState): boolean {
  const allowed = TRANSITIONS[from];
  return allowed !== undefined && to in allowed;
}

export function getValidNextStates(from: HandoffState): HandoffState[] {
  const allowed = TRANSITIONS[from];
  return allowed ? (Object.keys(allowed) as HandoffState[]) : [];
}

export function getEventForTransition(from: HandoffState, to: HandoffState): EventType | null {
  const allowed = TRANSITIONS[from];
  if (allowed && to in allowed) {
    return allowed[to as keyof typeof allowed] as EventType;
  }
  return null;
}

export function assertTransition(from: HandoffState, to: HandoffState): EventType {
  const event = getEventForTransition(from, to);
  if (!event) {
    throw new InvalidStateTransitionError(from, to);
  }
  return event;
}
