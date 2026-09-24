import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "~/lib/utils";
import { waitingRisk } from "~/lib/operational-status";

interface WaitingAgeProps {
  createdAt: string | Date;
  className?: string;
}

/**
 * Relative waiting time for a referral. This component deliberately does not
 * invent an escalation target; the service has no configured UI policy for one.
 */
export function WaitingAge({ createdAt, className }: WaitingAgeProps) {
  const risk = waitingRisk(createdAt);
  const duration = formatDistanceToNow(new Date(createdAt));

  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm", className)}>
      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">Waiting</span>
      <span className="tabular-nums font-medium text-foreground">{risk === "unknown" ? "unknown" : duration}</span>
    </span>
  );
}
