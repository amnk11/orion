import { Badge } from "~/components/ui/badge";
import { AlertTriangle, ArrowUpCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface UrgencyBadgeProps {
  level: "red" | "orange" | "green" | string;
  className?: string;
  showLabel?: boolean;
}

export function UrgencyBadge({ level, className, showLabel = true }: UrgencyBadgeProps) {
  const isRed = level === "red";
  const isOrange = level === "orange";
  const isGreen = level === "green";

  let variant: "urgency-red" | "urgency-orange" | "urgency-green" | "default" = "default";
  let Icon = HelpCircle;
  let label = "Unknown";

  if (isRed) {
    variant = "urgency-red";
    Icon = AlertTriangle;
    label = showLabel ? "Red Urgency" : "Red";
  } else if (isOrange) {
    variant = "urgency-orange";
    Icon = ArrowUpCircle;
    label = showLabel ? "Orange Urgency" : "Orange";
  } else if (isGreen) {
    variant = "urgency-green";
    Icon = CheckCircle2;
    label = showLabel ? "Green (Routine)" : "Green";
  }

  return (
    <Badge variant={variant} className={className}>
      <Icon className="size-3.5" />
      <span>{label}</span>
    </Badge>
  );
}
