import { describe, it, expect } from "vitest";
import {
  getCapabilityFreshness,
  getCapabilitySnapshotView,
  normalizeCapabilityStatus,
  toDbCapabilityStatus,
  formatAttestedAgo,
  CAPABILITY_FRESH_WINDOW_MS,
  CAPABILITY_STALE_WINDOW_MS,
} from "../capability-freshness.js";

// Fixed reference point so tests are deterministic.
const NOW = new Date("2026-09-21T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

describe("getCapabilityFreshness — window boundaries", () => {
  it("10 minutes ago -> FRESH", () => {
    expect(getCapabilityFreshness(ago(10 * MIN), NOW)).toBe("FRESH");
  });

  it("23 hours ago -> FRESH", () => {
    expect(getCapabilityFreshness(ago(23 * HOUR), NOW)).toBe("FRESH");
  });

  it("just under 24 hours -> FRESH (upper FRESH boundary)", () => {
    expect(getCapabilityFreshness(ago(CAPABILITY_FRESH_WINDOW_MS - 1), NOW)).toBe("FRESH");
  });

  it("exactly 24 hours -> STALE (lower STALE boundary is inclusive)", () => {
    expect(getCapabilityFreshness(ago(24 * HOUR), NOW)).toBe("STALE");
    expect(getCapabilityFreshness(ago(CAPABILITY_FRESH_WINDOW_MS), NOW)).toBe("STALE");
  });

  it("48 hours ago -> STALE", () => {
    expect(getCapabilityFreshness(ago(48 * HOUR), NOW)).toBe("STALE");
  });

  it("exactly 72 hours -> STALE (upper STALE boundary is inclusive)", () => {
    expect(getCapabilityFreshness(ago(72 * HOUR), NOW)).toBe("STALE");
    expect(getCapabilityFreshness(ago(CAPABILITY_STALE_WINDOW_MS), NOW)).toBe("STALE");
  });

  it("just over 72 hours -> VERY_STALE", () => {
    expect(getCapabilityFreshness(ago(CAPABILITY_STALE_WINDOW_MS + 1), NOW)).toBe("VERY_STALE");
  });

  it("5 days ago -> VERY_STALE", () => {
    expect(getCapabilityFreshness(ago(5 * 24 * HOUR), NOW)).toBe("VERY_STALE");
  });

  it("missing or invalid attestedAt -> VERY_STALE (never appears fresher than it is)", () => {
    expect(getCapabilityFreshness(null, NOW)).toBe("VERY_STALE");
    expect(getCapabilityFreshness(undefined, NOW)).toBe("VERY_STALE");
    expect(getCapabilityFreshness("not-a-date", NOW)).toBe("VERY_STALE");
  });

  it("accepts ISO strings as well as Date objects", () => {
    expect(getCapabilityFreshness(ago(2 * HOUR).toISOString(), NOW)).toBe("FRESH");
  });

  it("future timestamps (clock skew) are treated as FRESH, not stale", () => {
    expect(getCapabilityFreshness(new Date(NOW.getTime() + HOUR), NOW)).toBe("FRESH");
  });
});

describe("status and freshness are independent dimensions", () => {
  const cases: Array<[string, number, string, string]> = [
    // [rawStatus, ageMs, expectedStatus, expectedFreshness]
    ["verified_available", 2 * HOUR, "AVAILABLE", "FRESH"],
    ["verified_available", 5 * 24 * HOUR, "AVAILABLE", "VERY_STALE"],
    ["verified_unavailable", 2 * HOUR, "UNAVAILABLE", "FRESH"],
    ["verified_unavailable", 48 * HOUR, "UNAVAILABLE", "STALE"],
    ["unknown", 2 * HOUR, "UNKNOWN", "FRESH"],
    ["unknown", 48 * HOUR, "UNKNOWN", "STALE"],
  ];

  for (const [rawStatus, ageMs, expectedStatus, expectedFreshness] of cases) {
    it(`${rawStatus} + ${expectedFreshness.toLowerCase()} keeps status=${expectedStatus}`, () => {
      const view = getCapabilitySnapshotView({ status: rawStatus, attestedAt: ago(ageMs) }, NOW);
      expect(view.status).toBe(expectedStatus);
      expect(view.freshness).toBe(expectedFreshness);
    });
  }

  it("AVAILABLE + stale is never presented as freshly verified", () => {
    const view = getCapabilitySnapshotView(
      { status: "verified_available", attestedAt: ago(5 * 24 * HOUR) },
      NOW
    );
    expect(view.status).toBe("AVAILABLE");
    expect(view.freshness).toBe("VERY_STALE");
    expect(view.verifiedLabel).toContain("Not verified recently");
    expect(view.verifiedLabel).not.toMatch(/^Verified /);
  });

  it("UNKNOWN + fresh is still UNKNOWN, only freshly attested", () => {
    const view = getCapabilitySnapshotView({ status: "unknown", attestedAt: ago(2 * HOUR) }, NOW);
    expect(view.status).toBe("UNKNOWN");
    expect(view.freshness).toBe("FRESH");
    expect(view.verifiedLabel).toBe("Verified 2 hours ago");
  });
});

describe("verifiedLabel — as-of phrasing, never live claims", () => {
  it("FRESH uses 'Verified X ago'", () => {
    const view = getCapabilitySnapshotView(
      { status: "verified_available", attestedAt: ago(8 * HOUR) },
      NOW
    );
    expect(view.verifiedLabel).toBe("Verified 8 hours ago");
    expect(view.freshnessLabel).toBe("8 hours ago");
  });

  it("STALE uses 'Last verified X ago'", () => {
    const view = getCapabilitySnapshotView(
      { status: "verified_available", attestedAt: ago(2 * 24 * HOUR) },
      NOW
    );
    expect(view.verifiedLabel).toBe("Last verified 2 days ago");
  });

  it("VERY_STALE uses 'Not verified recently'", () => {
    const view = getCapabilitySnapshotView(
      { status: "verified_available", attestedAt: ago(15 * 24 * HOUR) },
      NOW
    );
    expect(view.verifiedLabel).toBe("Not verified recently (last verified 15 days ago)");
  });

  it("missing attestedAt -> 'Not verified recently' with null attestedAt", () => {
    const view = getCapabilitySnapshotView({ status: "unknown", attestedAt: null }, NOW);
    expect(view.verifiedLabel).toBe("Not verified recently");
    expect(view.attestedAt).toBeNull();
    expect(view.freshness).toBe("VERY_STALE");
  });
});

describe("status normalization (DB <-> business contract)", () => {
  it("normalizes storage values", () => {
    expect(normalizeCapabilityStatus("verified_available")).toBe("AVAILABLE");
    expect(normalizeCapabilityStatus("verified_unavailable")).toBe("UNAVAILABLE");
    expect(normalizeCapabilityStatus("unknown")).toBe("UNKNOWN");
  });

  it("is idempotent for business values", () => {
    expect(normalizeCapabilityStatus("AVAILABLE")).toBe("AVAILABLE");
    expect(normalizeCapabilityStatus("UNAVAILABLE")).toBe("UNAVAILABLE");
    expect(normalizeCapabilityStatus("UNKNOWN")).toBe("UNKNOWN");
  });

  it("unrecognized values degrade to UNKNOWN (never looks available)", () => {
    expect(normalizeCapabilityStatus("garbage")).toBe("UNKNOWN");
  });

  it("maps business values back to storage values", () => {
    expect(toDbCapabilityStatus("AVAILABLE")).toBe("verified_available");
    expect(toDbCapabilityStatus("UNAVAILABLE")).toBe("verified_unavailable");
    expect(toDbCapabilityStatus("UNKNOWN")).toBe("unknown");
  });
});

describe("formatAttestedAgo", () => {
  it("renders compact relative labels", () => {
    expect(formatAttestedAgo(ago(30 * 1000), NOW)).toBe("just now");
    expect(formatAttestedAgo(ago(MIN), NOW)).toBe("1 minute ago");
    expect(formatAttestedAgo(ago(45 * MIN), NOW)).toBe("45 minutes ago");
    expect(formatAttestedAgo(ago(HOUR), NOW)).toBe("1 hour ago");
    expect(formatAttestedAgo(ago(8 * HOUR), NOW)).toBe("8 hours ago");
    expect(formatAttestedAgo(ago(24 * HOUR), NOW)).toBe("1 day ago");
    expect(formatAttestedAgo(ago(3 * 24 * HOUR), NOW)).toBe("3 days ago");
    expect(formatAttestedAgo(null, NOW)).toBe("never");
  });
});

