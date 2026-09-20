import { Badge } from "~/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Info, XCircle } from "lucide-react";

interface StatusBadgeProps {
  state: string;
  className?: string;
}

export function StatusBadge({ state, className }: StatusBadgeProps) {
  const normalizedState = state.toLowerCase();
  
  const isPositive = ["accepted", "arrived", "in_care", "outcome_recorded", "completed"].includes(normalizedState);
  const isWarning = ["draft", "sent", "acknowledged", "follow_up_pending", "redirected"].includes(normalizedState);
  const isDestructive = ["cannot_accept", "no_show", "rejected", "cancelled"].includes(normalizedState);
  const isTerminal = ["closed"].includes(normalizedState);

  let variant: "status-success" | "status-warning" | "status-danger" | "status-neutral" = "status-neutral";
  let Icon = Info;

  if (isPositive) {
    variant = "status-success";
    Icon = CheckCircle2;
  } else if (isWarning) {
    variant = "status-warning";
    Icon = Clock;
  } else if (isDestructive) {
    variant = "status-danger";
    Icon = AlertTriangle;
  } else if (isTerminal) {
    variant = "status-neutral";
    Icon = XCircle;
  }

  return (
    <Badge variant={variant} className={className}>
      <Icon className="size-3.5" />
      <span className="capitalize">{state.replace(/_/g, " ")}</span>
    </Badge>
  );
}
