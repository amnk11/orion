/**
 * Capability freshness derivation.
 *
 * A capability snapshot has two INDEPENDENT dimensions:
 *
 *   1. BUSINESS STATUS — what the facility last reported:
 *      AVAILABLE | UNAVAILABLE | UNKNOWN
 *   2. FRESHNESS — how old that report is, DERIVED from `attestedAt`:
 *      FRESH (< 24h) | STALE (24h–72h inclusive) | VERY_STALE (> 72h)
 *
 * These must never be collapsed into one value. e.g. AVAILABLE + attested
 * 5 days ago means "AVAILABLE — stale", NOT "verified available now".
 * The UI must never present stale data as a live/real-time claim.
 */

export const CAPABILITY_STATUSES = ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"] as const;
export type CapabilityStatus = (typeof CAPABILITY_STATUSES)[number];

export const CAPABILITY_FRESHNESS_LEVELS = ["FRESH", "STALE", "VERY_STALE"] as const;
export type CapabilityFreshness = (typeof CAPABILITY_FRESHNESS_LEVELS)[number];

/**
 * Storage-level status values used by the `capability_snapshots` table.
 * The DB encodes the fact that a human attested the value ("verified_*"),
 * while the API/UI contract uses the plain business status.
 */
export const DB_CAPABILITY_STATUSES = [
  "verified_available",
  "verified_unavailable",
  "unknown",
] as const;
export type DbCapabilityStatus = (typeof DB_CAPABILITY_STATUSES)[number];

/** Freshness windows (milliseconds). */
export const CAPABILITY_FRESH_WINDOW_MS = 24 * 60 * 60 * 1000; // < 24h => FRESH
export const CAPABILITY_STALE_WINDOW_MS = 72 * 60 * 60 * 1000; // 24h..72h (inclusive) => STALE; > 72h => VERY_STALE

/** Service codes currently defined by the repository (see seed). */
export const CAPABILITY_SERVICE_CODES = [
  "obgyn",
  "functional_ot",
  "blood_bank",
  "icu",
  "lab",
] as const;
export type CapabilityServiceCode = (typeof CAPABILITY_SERVICE_CODES)[number];

export const CAPABILITY_SERVICE_LABELS: Record<string, string> = {
  obgyn: "ObGyn",
  functional_ot: "Functional OT",
  blood_bank: "Blood Bank",
  icu: "ICU",
  lab: "Laboratory",
};

/**
 * Maps a storage-level status to its business status.
 * Accepts already-normalized values too (idempotent).
 */
export function normalizeCapabilityStatus(raw: string): CapabilityStatus {
  switch (raw) {
    case "verified_available":
    case "AVAILABLE":
    case "available":
      return "AVAILABLE";
    case "verified_unavailable":
    case "UNAVAILABLE":
    case "unavailable":
      return "UNAVAILABLE";
    default:
      return "UNKNOWN";
  }
}

/** Maps a business status to its storage-level representation. */
export function toDbCapabilityStatus(status: CapabilityStatus): DbCapabilityStatus {
  switch (status) {
    case "AVAILABLE":
      return "verified_available";
    case "UNAVAILABLE":
      return "verified_unavailable";
    default:
      return "unknown";
  }
}


/**
 * Derives freshness from an attestation timestamp.
 *
 * Boundaries (age relative to `now`):
 *   age < 24h            -> FRESH
 *   24h <= age <= 72h    -> STALE
 *   age > 72h            -> VERY_STALE
 *
 * Missing/invalid timestamps are VERY_STALE: capability data must never
 * appear more current than it actually is.
 */
export function getCapabilityFreshness(
  attestedAt: Date | string | null | undefined,
  now: Date = new Date()
): CapabilityFreshness {
  if (!attestedAt) return "VERY_STALE";
  const attested = attestedAt instanceof Date ? attestedAt : new Date(attestedAt);
  if (Number.isNaN(attested.getTime())) return "VERY_STALE";

  const ageMs = now.getTime() - attested.getTime();
  if (ageMs < 0) return "FRESH"; // clock skew: treat future timestamps as fresh
  if (ageMs < CAPABILITY_FRESH_WINDOW_MS) return "FRESH";
  if (ageMs <= CAPABILITY_STALE_WINDOW_MS) return "STALE";
  return "VERY_STALE";
}

/**
 * Dependency-free relative label, e.g. "8 hours ago", "2 days ago".
 * (The web app may render its own locale-aware label; this keeps the
 * domain package free of UI dependencies.)
 */
export function formatAttestedAgo(
  attestedAt: Date | string | null | undefined,
  now: Date = new Date()
): string {
  if (!attestedAt) return "never";
  const attested = attestedAt instanceof Date ? attestedAt : new Date(attestedAt);
  if (Number.isNaN(attested.getTime())) return "never";

  const ageMs = Math.max(0, now.getTime() - attested.getTime());
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export interface CapabilitySnapshotView {
  status: CapabilityStatus;
  freshness: CapabilityFreshness;
  attestedAt: string | null;
  /** Relative age, e.g. "8 hours ago" */
  freshnessLabel: string;
  /**
   * As-of phrasing that never claims live availability:
   *   FRESH      -> "Verified 8 hours ago"
   *   STALE      -> "Last verified 2 days ago"
   *   VERY_STALE -> "Not verified recently (last verified 5 days ago)"
   */
  verifiedLabel: string;
}

/**
 * Combines a raw snapshot (any status encoding) into the presentation view.
 * Status and freshness stay independent.
 */
export function getCapabilitySnapshotView(
  snapshot: { status: string; attestedAt: Date | string | null | undefined },
  now: Date = new Date()
): CapabilitySnapshotView {
  const freshness = getCapabilityFreshness(snapshot.attestedAt, now);
  const ago = formatAttestedAgo(snapshot.attestedAt, now);
  const attested = snapshot.attestedAt
    ? snapshot.attestedAt instanceof Date
      ? snapshot.attestedAt
      : new Date(snapshot.attestedAt)
    : null;
  const attestedValid = attested !== null && !Number.isNaN(attested.getTime());

  let verifiedLabel: string;
  if (!attestedValid) {
    verifiedLabel = "Not verified recently";
  } else if (freshness === "FRESH") {
    verifiedLabel = `Verified ${ago}`;
  } else if (freshness === "STALE") {
    verifiedLabel = `Last verified ${ago}`;
  } else {
    verifiedLabel = `Not verified recently (last verified ${ago})`;
  }

  return {
    status: normalizeCapabilityStatus(snapshot.status),
    freshness,
    attestedAt: attestedValid ? attested.toISOString() : null,
    freshnessLabel: ago,
    verifiedLabel,
  };
}
