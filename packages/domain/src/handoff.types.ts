export const HANDOFF_STATES = [
  "draft",
  "sent",
  "accepted",
  "cannot_accept",
  "redirected",
  "arrived",
  "no_show",
  "return_noted",
  "closed",
] as const;

export type HandoffState = typeof HANDOFF_STATES[number];

export const URGENCY_LEVELS = [
  "red",
  "orange",
  "green",
] as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[number];

export const EVENT_TYPES = [
  "handoff_created",
  "handoff_sent",
  "handoff_viewed",
  "handoff_accepted",
  "handoff_cannot_accept",
  "handoff_redirected",
  "patient_arrived",
  "patient_no_show",
  "return_note_added",
  "handoff_closed",
] as const;

export type EventType = typeof EVENT_TYPES[number];

export const CANNOT_ACCEPT_REASONS = [
  "specialist_unavailable",
  "equipment_unavailable",
  "no_appropriate_bed",
  "blood_service_unavailable",
  "wrong_level",
  "operational",
] as const;

export type CannotAcceptReason = typeof CANNOT_ACCEPT_REASONS[number];
