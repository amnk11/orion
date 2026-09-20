import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface StateBadgeProps {
  state: string;
  className?: string;
}

export function StateBadge({ state, className }: StateBadgeProps) {
  const normalizedState = state.toLowerCase();
  
  const isPositive = ["accepted", "arrived", "in_care", "outcome_recorded"].includes(normalizedState);
  const isNeutral = ["draft", "sent", "acknowledged"].includes(normalizedState);
  const isWarning = ["redirected", "follow_up_pending"].includes(normalizedState);
  const isDestructive = ["cannot_accept", "no_show"].includes(normalizedState);
  const isTerminal = ["closed"].includes(normalizedState);

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-medium shadow-sm transition-colors",
        isPositive && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        isNeutral && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        isWarning && "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
        isDestructive && "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        isTerminal && "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        className
      )}
    >
      {state.replace(/_/g, " ")}
    </Badge>
  );
}
