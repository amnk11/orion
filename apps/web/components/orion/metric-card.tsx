import * as React from "react";
import { cn } from "~/lib/utils";

interface MetricCardProps {
  label: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "danger";
  className?: string;
}

/**
 * Standardized KPI/Attention card extracted from supervisor dashboard.
 */
export function MetricCard({ label, count, description, icon, tone = "default", className }: MetricCardProps) {
  const toneClass = 
    tone === "danger" ? "border-danger/30 bg-danger/5" : 
    tone === "warning" ? "border-warning/30 bg-warning/5" : 
    "border-border bg-card";
    
  // If count is zero on a warning/danger tone, de-emphasize it
  const isZeroLoud = count === 0 && tone !== "default";
  
  return (
    <section 
      className={cn(
        "rounded-lg border p-4", 
        isZeroLoud ? "border-border/50 bg-muted/20 opacity-75" : toneClass,
        className
      )} 
      aria-label={`${label}: ${count}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("text-muted-foreground", isZeroLoud && "opacity-50")} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className={cn(
        "mt-3 text-3xl font-semibold tabular-nums text-foreground",
        isZeroLoud && "text-muted-foreground"
      )}>
        {count}
      </p>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>
    </section>
  );
}
