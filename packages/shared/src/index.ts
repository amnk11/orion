export type UserRole =
  | "origin"
  | "destination"
  | "supervisor";

export const USER_ROLES = [
  "origin",
  "destination",
  "supervisor",
] as const;

export const SHARED_PACKAGE = "@orion/shared";
