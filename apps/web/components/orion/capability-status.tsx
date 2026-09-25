import { formatDistanceToNow } from "date-fns";
import { Clock, AlertTriangle, HelpCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

/**
 * Phase 8 — Capability snapshot presentation.
 *
 * Renders a facility capability as BUSINESS STATUS + FRESHNESS, which are
 * independent dimensions. The wording is always "as of" phrasing
 * ("Verified X ago" / "Last verified X ago" / "Not verified recently") so
 * the UI never makes a false real-time availability claim.
 */

export type CapabilityBusinessStatus = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
export type CapabilityFreshnessLevel = "FRESH" | "STALE" | "VERY_STALE";

export interface CapabilityView {
  id: string;
  serviceCode: string;
  serviceLabel: string;
  status: CapabilityBusinessStatus;
  freshness: CapabilityFreshnessLevel;
  attestedAt: string | null;
  note: string | null;
}

/** Human "X ago" for an attestation timestamp. */
export function attestedAgoLabel(attestedAt: string | null): string {
  if (!attestedAt) return "never";
  const date = new Date(attestedAt);
  if (Number.isNaN(date.getTime())) return "never";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * As-of verified phrasing. Never says "currently available" / "available now".
 */
export function verifiedLabel(cap: Pick<CapabilityView, "freshness" | "attestedAt">): string {
  const ago = attestedAgoLabel(cap.attestedAt);
  if (!cap.attestedAt) return "Not verified recently";
  switch (cap.freshness) {
    case "FRESH":
      return `Verified ${ago}`;
    case "STALE":
      return `Last verified ${ago}`;
    case "VERY_STALE":
      return `CRITICAL: Data severely outdated · last verified ${ago}`;
  }
}

const STATUS_LABEL: Record<CapabilityBusinessStatus, string> = {
  AVAILABLE: "Available",
  UNAVAILABLE: "Unavailable",
  UNKNOWN: "Unknown",
};

const STATUS_BADGE_VARIANT: Record<
  CapabilityBusinessStatus,
  "status-success" | "status-neutral"
> = {
  AVAILABLE: "status-success",
  UNAVAILABLE: "status-neutral",
  UNKNOWN: "status-neutral",
};

interface CapabilityStatusRowProps {
  capability: CapabilityView;
  className?: string;
}

/**
 * Compact capability row used on destination selection cards.
 * Shows: service name, status badge, and an as-of freshness line with a
 * subtle warning treatment for stale data.
 */
export function CapabilityStatusRow({ capability, className }: CapabilityStatusRowProps) {
  const isStale = capability.freshness === "STALE";
  const isVeryStale = capability.freshness === "VERY_STALE";

  return (
    <div
      aria-label={`Capability: ${capability.serviceLabel}. ${STATUS_LABEL[capability.status]}. ${verifiedLabel(capability)}.`}
      className={cn(
        "flex flex-col gap-1 p-2 rounded-md border",
        isVeryStale
          ? "bg-warning/5 border-warning/30"
          : isStale
            ? "bg-muted/50 border-warning/20"
            : "bg-muted/50 border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {capability.serviceLabel}
        </span>
        <span className="flex items-center gap-1.5">
          {(isStale || isVeryStale) && (
            <AlertTriangle
              className={cn("size-3", isVeryStale ? "text-warning" : "text-warning/80")}
              aria-hidden="true"
            />
          )}
          {capability.status === "UNKNOWN" && (
            <HelpCircle className="size-3 text-muted-foreground" aria-hidden="true" />
          )}
          <Badge variant={STATUS_BADGE_VARIANT[capability.status]} className="text-xs px-1.5 py-0">
            {STATUS_LABEL[capability.status]}
          </Badge>
        </span>
      </div>
      <div
        className={cn(
          "flex items-center flex-wrap gap-1.5 text-xs",
          isVeryStale
            ? "text-danger font-semibold"
            : isStale
              ? "text-warning font-medium"
              : "text-muted-foreground"
        )}
      >
        <Clock className="size-3.5 shrink-0" />
        <span>{verifiedLabel(capability)}</span>
        
        {isVeryStale && (
          <Badge variant="destructive" className="text-xs px-1.5 py-0 ml-auto h-4 rounded-sm">
            Critically Stale
          </Badge>
        )}
        {isStale && !isVeryStale && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 ml-auto h-4 rounded-sm text-warning border-warning/50 bg-warning/10">
            Stale Data
          </Badge>
        )}
      </div>
    </div>
  );
}


