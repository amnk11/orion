export type UserRole =
  | "origin"
  | "destination"
  | "supervisor"
  | "admin";

export const USER_ROLES = [
  "origin",
  "destination",
  "supervisor",
  "admin",
] as const;

export type Permission =
  | "patient:create"
  | "patient:read"
  | "assessment:create"
  | "handoff:create"
  | "handoff:read"
  | "handoff:transition"
  | "followup:read"
  | "followup:complete"
  | "capability:attest"
  | "dashboard:read"
  | "user:manage"
  | "facility:manage";

export const SHARED_PACKAGE = "@orion/shared";
