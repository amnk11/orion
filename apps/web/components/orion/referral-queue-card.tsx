import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { StatusBadge } from "~/components/ui/status-badge";
import { SyncStatus, toSyncStatus } from "~/components/ui/sync-status";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { WaitingAge } from "~/components/orion/waiting-age";
import { cn } from "~/lib/utils";

interface ReferralQueueCardProps {
  href: string;
  publicCode: string;
  patientName: string;
  urgency: string;
  state: string;
  createdAt: string;
  /** Local/offline sync state, when this record exists only on this device. */
  syncStatus?: string | null;
  /** Extra decision context, e.g. the origin facility for a destination inbox. */
  secondary?: ReactNode;
  /** Drives the visual weight and label of the primary action. */
  actionRequired: boolean;
  className?: string;
}

/**
 * Compact operational row used at narrow widths in place of the multi-column
 * queue table. Urgency, patient, waiting age, state and the primary action are
 * always inside the first visible plane — no horizontal scrolling required.
 */
export function ReferralQueueCard({
  href,
  publicCode,
  patientName,
  urgency,
  state,
  createdAt,
  syncStatus,
  secondary,
  actionRequired,
  className,
}: ReferralQueueCardProps) {
  const sync = toSyncStatus(syncStatus);

  return (
    <article className={cn("flex flex-col gap-3 py-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-xs text-muted-foreground">{publicCode}</p>
          <h3 className="text-base font-semibold leading-snug text-foreground break-words">{patientName}</h3>
        </div>
        <UrgencyBadge level={urgency} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        <StatusBadge state={state} />
        {sync && <SyncStatus status={sync} compact />}
        {secondary && <div className="text-sm text-muted-foreground border-l border-border pl-2 ml-1 truncate">{secondary}</div>}
      </div>

      <div className="flex items-center justify-between mt-3">
        <WaitingAge createdAt={createdAt} />
        <Link href={href} className="shrink-0">
          <Button
            size="sm"
            variant={actionRequired ? "default" : "outline"}
            className="h-8 text-xs px-3 rounded-full font-medium"
            aria-label={actionRequired ? `Review and act on referral ${publicCode}` : `Review referral ${publicCode}`}
          >
            {actionRequired ? "Action" : "Review"}
            <ChevronRight className="size-3.5 ml-1" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </article>
  );
}

