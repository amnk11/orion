import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "~/lib/utils";

interface QueueSectionProps {
  /** Anchor/id used for the section heading relationship. */
  id: string;
  title: string;
  description: string;
  count: number;
  /** `action` marks the queue that needs a decision now. */
  tone?: "action" | "monitor";
  children: ReactNode;
  className?: string;
}

/**
 * Segment of an operational queue. Separates "needs a decision now" from work
 * that is only being monitored, so urgency does not have to carry that meaning
 * on its own.
 */
export function QueueSection({
  id,
  title,
  description,
  count,
  tone = "monitor",
  children,
  className,
}: QueueSectionProps) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn(
        "rounded-lg border bg-card",
        tone === "action" ? "border-warning/40" : "border-border",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-4 py-3",
          tone === "action" ? "border-warning/30 bg-warning/5" : "border-border bg-surface-inset"
        )}
      >
        <h2 id={`${id}-heading`} className="text-base font-semibold text-foreground">
          {title}
          <span className="ml-2 font-normal text-muted-foreground">
            {count} {count === 1 ? "referral" : "referrals"}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Row-level expand control shared by the queue "load more" affordances. */
export function LoadMoreRow({ remaining, onClick, label }: { remaining: number; onClick: () => void; label: string }) {
  if (remaining <= 0) return null;
  return (
    <div className="flex justify-center py-3">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {label} <span className="text-muted-foreground">({remaining} more)</span>
        <ChevronRight className="size-4 rotate-90" aria-hidden="true" />
      </button>
    </div>
  );
}
