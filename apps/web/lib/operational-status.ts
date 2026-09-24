import { ClinicalDictionary } from "~/lib/clinical-dictionary";

/**
 * Shared operational model for referral queues.
 *
 * This module is the single place that answers three questions the UI must never
 * answer inconsistently:
 *   1. Does this record still need a human decision from *this* desk?
 *   2. How long has the patient been waiting?
 *   3. In plain language, what does the current state mean and what is the next
 *      safe action?
 *
 * It intentionally contains no rendering, so both the origin queue and the
 * destination inbox use the same rules.
 */

/** Destination-side states that require a decision from the receiving facility. */
export const DESTINATION_ACTION_STATES = ["sent", "acknowledged", "cannot_accept"];

/** Origin-side states where the referring facility still owes a follow-up action. */
export const ORIGIN_ACTION_STATES = ["no_show", "outcome_recorded", "follow_up_pending"];

/** Local-only states produced by the offline queue. */
export const OFFLINE_LOCAL_STATES = ["offline_queue", "error"];

/**
 * The frontend intentionally has no waiting-time escalation threshold. No
 * configured/domain policy currently supplies one, and inventing a 4h/24h
 * target in presentation would silently change an operational rule. Consumers
 * show relative elapsed time and can add a policy-backed signal later.
 */
export type WaitingRisk = "relative" | "unknown";

export type OperationalRole = "origin" | "destination";

/** Milliseconds this referral has been waiting. Returns null for unparsable dates. */
export function waitingMs(createdAt: string | Date): number | null {
  const started = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const startedMs = started.getTime();
  if (Number.isNaN(startedMs)) return null;
  return Math.max(0, Date.now() - startedMs);
}

/** Whether a waiting duration can be represented accurately. */
export function waitingRisk(createdAt: string | Date): WaitingRisk {
  const elapsed = waitingMs(createdAt);
  return elapsed === null ? "unknown" : "relative";
}

/** Honest text label where no operational service-level target is configured. */
export function waitingRiskLabel(risk: WaitingRisk): string {
  switch (risk) {
    case "relative":
      return "Relative waiting time";
    case "unknown":
      return "Waiting time unknown";
  }
}

export function requiresDestinationDecision(state: string): boolean {
  return DESTINATION_ACTION_STATES.includes(state);
}

export function requiresOriginAction(state: string): boolean {
  return ORIGIN_ACTION_STATES.includes(state);
}

export function isLocalOnlyState(state: string): boolean {
  return OFFLINE_LOCAL_STATES.includes(state);
}

export interface StateGuidance {
  /** Short user-facing status name. */
  label: string;
  /** What this state means operationally. */
  meaning: string;
  /** The next safe action, written from the current desk's point of view. */
  nextStep: string;
}



interface StateDefinition {
  meaning: string;
  originNextStep: string;
  destinationNextStep: string;
}

const STATE_DEFINITIONS: Record<string, StateDefinition> = {
  draft: {
    meaning: "The referral is being prepared and has not been dispatched.",
    originNextStep: "Complete the wizard and dispatch the referral.",
    destinationNextStep: "No action — the referral has not been dispatched yet.",
  },
  offline_queue: {
    meaning: "Saved on this device only. The server has not received this referral.",
    originNextStep: "Reconnect and retry the sync; the destination cannot see it yet.",
    destinationNextStep: "No action — the referral is not on the server yet.",
  },
  error: {
    meaning: "Sync failed. This referral exists only on this device.",
    originNextStep: "Retry the sync; if it keeps failing, re-create the referral.",
    destinationNextStep: "No action — the referral is not on the server yet.",
  },
  sent: {
    meaning: "Dispatched to the destination facility. Receipt is not yet confirmed.",
    originNextStep: "Wait for the destination to acknowledge receipt, and chase it if it stays unacknowledged.",
    destinationNextStep: "Acknowledge receipt, then accept the patient or record why you cannot accept.",
  },
  acknowledged: {
    meaning: "The destination has confirmed receipt and is deciding.",
    originNextStep: "No action needed yet — the destination is still deciding.",
    destinationNextStep: "Accept the patient, or record a reason you cannot accept.",
  },
  accepted: {
    meaning: "The destination has accepted responsibility for this patient.",
    originNextStep: "Arrange transport and send the patient with the referral details.",
    destinationNextStep: "Mark arrival once the patient reaches the facility.",
  },
  cannot_accept: {
    meaning: "The destination cannot accept and the referral needs a new destination.",
    originNextStep: "The destination must redirect; escalate if this stalls.",
    destinationNextStep: "Redirect to another facility and record the reason.",
  },
  redirected: {
    meaning: "The referral was sent to a different destination facility.",
    originNextStep: "No action — the new destination must acknowledge receipt.",
    destinationNextStep: "Acknowledge receipt, then accept or record why you cannot accept.",
  },
  arrived: {
    meaning: "The patient has physically arrived at the destination.",
    originNextStep: "Awaiting destination outcome; no action needed now.",
    destinationNextStep: "Start care, or record the outcome if care is already complete.",
  },
  in_care: {
    meaning: "The patient is receiving care at the destination.",
    originNextStep: "Awaiting destination outcome; no action needed now.",
    destinationNextStep: "Record the outcome when care is complete.",
  },
  no_show: {
    meaning: "The patient did not arrive at the destination.",
    originNextStep: "Contact the patient, then either re-refer or close the episode.",
    destinationNextStep: "No action — the referring facility decides the next step.",
  },
  outcome_recorded: {
    meaning: "The destination has recorded the outcome of care.",
    originNextStep: "Close the episode and schedule follow-up if the outcome requires it.",
    destinationNextStep: "No action — the referring facility closes the episode.",
  },
  follow_up_pending: {
    meaning: "Outcome recorded and a follow-up action is due.",
    originNextStep: "Complete the follow-up in Follow-ups.",
    destinationNextStep: "No action — the referring facility owns the follow-up.",
  },
  closed: {
    meaning: "The episode is closed. This record is retained for audit.",
    originNextStep: "No further action.",
    destinationNextStep: "No further action.",
  },
};

/**
 * Plain-language explanation plus the next safe action for a workflow state.
 * Unknown states are described honestly rather than given a confident label.
 */
export function stateGuidance(state: string, role: OperationalRole): StateGuidance {
  const definition = STATE_DEFINITIONS[state];
  const label = ClinicalDictionary.formatStatus(state);

  if (!definition) {
    return {
      label,
      meaning: "This state is not described in the client workflow model.",
      nextStep: "Confirm the current state with the other facility before acting.",
    };
  }

  return {
    label,
    meaning: definition.meaning,
    nextStep: role === "origin" ? definition.originNextStep : definition.destinationNextStep,
  };
}

/**
 * Splits a queue into work that needs a decision now and work that is only being
 * monitored, preserving the incoming order inside each group.
 */
export function segmentQueue<T>(
  items: T[],
  isActionRequired: (item: T) => boolean
): { actionRequired: T[]; monitoring: T[] } {
  const actionRequired: T[] = [];
  const monitoring: T[] = [];
  for (const item of items) {
    if (isActionRequired(item)) actionRequired.push(item);
    else monitoring.push(item);
  }
  return { actionRequired, monitoring };
}
