import { ArrowRight } from "lucide-react";
import { StatusBadge } from "~/components/ui/status-badge";
import { cn } from "~/lib/utils";
import { stateGuidance, type OperationalRole } from "~/lib/operational-status";

interface StateGuidancePanelProps {
  /** Current workflow state of the handoff, e.g. `acknowledged`. */
  state: string;
  /** Which desk is reading the record; drives who owns the next step. */
  role: OperationalRole;
  className?: string;
}

/**
 * Explains the current workflow state in plain language and states the next safe
 * action for the desk that is reading the record. Lifecycle names such as
 * "Dispatched" or "In Care" are not self-explanatory under time pressure.
 */
export function StateGuidancePanel({ state, role, className }: StateGuidancePanelProps) {
  const guidance = stateGuidance(state, role);

  return (
    <section
      aria-label="Current referral state and next step"
      className={cn("rounded-lg border border-border bg-surface-inset px-4 py-3", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge state={state} />
        <span className="text-sm text-muted-foreground">{guidance.meaning}</span>
      </div>
      {guidance.nextStep !== "No further action." && (
        <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-foreground">
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <span className="text-muted-foreground">Next step: </span>
            {guidance.nextStep}
          </span>
        </p>
      )}
    </section>
  );
}
