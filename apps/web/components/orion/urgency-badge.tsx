import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface UrgencyBadgeProps {
  level: "red" | "orange" | "green" | string;
  className?: string;
  showLabel?: boolean;
}

export function UrgencyBadge({ level, className, showLabel = true }: UrgencyBadgeProps) {
  const isRed = level === "red";
  const isOrange = level === "orange";
  const isGreen = level === "green";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-transparent shadow-sm",
        isRed && "bg-red-500 hover:bg-red-600 text-white",
        isOrange && "bg-orange-500 hover:bg-orange-600 text-white",
        isGreen && "bg-emerald-500 hover:bg-emerald-600 text-white",
        !isRed && !isOrange && !isGreen && "bg-slate-200 text-slate-700",
        className
      )}
    >
      {showLabel ? (
        <>
          {isRed && "Red Urgency"}
          {isOrange && "Orange Urgency"}
          {isGreen && "Green (Routine)"}
          {!isRed && !isOrange && !isGreen && "Unknown"}
        </>
      ) : (
        <>
          {isRed && "Red"}
          {isOrange && "Orange"}
          {isGreen && "Green"}
          {!isRed && !isOrange && !isGreen && "Unknown"}
        </>
      )}
    </Badge>
  );
}
