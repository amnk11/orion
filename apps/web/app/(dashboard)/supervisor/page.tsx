"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { useSessionUser } from "~/hooks/use-session-user";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import { MetricCard } from "~/components/orion/metric-card";
import { PageShell } from "~/components/orion/page-shell";
import { PageHeader } from "~/components/orion/page-header";

interface DashboardSummary {
  stateCounts: Record<string, number>;
  ageing: Record<string, number>;
  redirectReasons: Record<string, number>;
  noShowRate: number;
  outcomeRate: number;
  followUps: { total: number; completed: number; overdue: number; pending: number };
  capabilityFreshness: { FRESH: number; STALE: number; VERY_STALE: number; UNKNOWN: number };
}

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const { user, isPending, isOrigin, isDestination, isSupervisor } = useSessionUser();

  React.useEffect(() => {
    if (!isPending) {
      if (!user) router.replace("/login");
      else if (isOrigin) router.replace("/app");
      else if (isDestination) router.replace("/destination");
      else if (!isSupervisor) router.replace("/login");
    }
  }, [user, isPending, router, isOrigin, isDestination, isSupervisor]);

  const summaryQuery = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const response = await fetch("/api/v1/dashboard/summary");
      if (!response.ok) throw new Error("The dashboard summary could not be loaded.");
      return ((await response.json()) as { data: DashboardSummary }).data;
    },
    enabled: !!isSupervisor,
  });

  if (isPending || summaryQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm">Loading operational summary…</span>
        </div>
      </main>
    );
  }

  if (!user || !isSupervisor) return null;

  if (summaryQuery.error) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 items-center p-4 md:p-8">
        <section className="max-w-xl rounded-lg border border-danger/20 bg-danger/5 p-6" role="alert">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard unavailable</h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            The operational summary could not be loaded. Check the connection and try again.
          </p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void summaryQuery.refetch()}>
            <RefreshCw className="mr-2 size-4" /> Try again
          </Button>
        </section>
      </main>
    );
  }

  const summary = summaryQuery.data;
  if (!summary) return null;

  const attention = [
    { label: "Overdue follow-ups", count: summary.followUps.overdue, description: "Follow-up work past its recorded due date.", icon: <Clock3 className="size-4" />, tone: "danger" as const },
    { label: "Pending referrals", count: summary.stateCounts.pending ?? 0, description: "Referrals awaiting the next operational transition.", icon: <AlertTriangle className="size-4" />, tone: "warning" as const },
    { label: "Cannot accept", count: summary.stateCounts.cannot_accept ?? 0, description: "Referrals that need a redirect or escalation.", icon: <ShieldAlert className="size-4" />, tone: "warning" as const },
    { label: "Very stale capabilities", count: summary.capabilityFreshness.VERY_STALE ?? 0, description: "Capability reports that should be refreshed before reliance.", icon: <WifiOff className="size-4" />, tone: "warning" as const },
  ];

  const ageingRows = Object.entries(summary.ageing).map(([bucket, count]) => ({ bucket, count }));
  const redirectRows = Object.entries(summary.redirectReasons).map(([reason, count]) => ({ reason, count }));

  return (
    <PageShell maxWidth="wide" className="pb-20">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-1.5 max-w-3xl">
        <p className="text-xs font-medium text-primary mb-1">Supervisor view</p>
        <PageHeader 
          title="Operational intervention" 
          description="Start with work that needs follow-up, a destination decision, or refreshed information." 
        />
      </div>

      {/* 2. NEEDS ATTENTION */}
      <section aria-labelledby="attention-heading" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 sm:gap-4">
          <h2 id="attention-heading" className="text-lg font-semibold text-foreground tracking-tight">
            Needs attention
          </h2>
          <p className="text-xs text-muted-foreground">
            Counts only; this summary does not expose record-level drill-down.
          </p>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {attention.map((item) => (
            <div 
              key={item.label} 
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4 transition-colors",
                item.tone === "danger" ? "border-danger/20 bg-danger/[0.02]" :
                item.tone === "warning" ? "border-warning/20 bg-warning/[0.02]" :
                "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                <span className={cn(
                  "shrink-0",
                  item.tone === "danger" ? "text-danger/80" :
                  item.tone === "warning" ? "text-warning/80" :
                  "text-muted-foreground"
                )}>
                  {item.icon}
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-auto">
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {item.count}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. OPERATIONAL OVERVIEW */}
      <section aria-labelledby="overview-heading" className="flex flex-col gap-4 pt-2">
        <h2 id="overview-heading" className="text-lg font-semibold text-foreground tracking-tight">
          Operational overview
        </h2>
        
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          
          {/* Waiting Time */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="bg-muted/10 border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Waiting time for pending referrals</h3>
            </div>
            <div className="divide-y divide-border/50">
              {ageingRows.map(({ bucket, count }) => (
                <div key={bucket} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{bucket}</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">{count}</span>
                </div>
              ))}
              {ageingRows.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No pending referrals.</div>
              )}
            </div>
          </div>

          {/* Follow-up Operations */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="bg-muted/10 border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Follow-up operations</h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border/50">
              {[
                { label: "Pending", value: summary.followUps.pending },
                { label: "Overdue", value: summary.followUps.overdue },
                { label: "Completed", value: summary.followUps.completed },
                { label: "Outcome rate", value: `${summary.outcomeRate}%` }
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 p-4">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Capability Freshness */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="bg-muted/10 border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Capability freshness</h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-border/50">
              {[
                { label: "Fresh", value: summary.capabilityFreshness.FRESH },
                { label: "Stale", value: summary.capabilityFreshness.STALE },
                { label: "Very stale", value: summary.capabilityFreshness.VERY_STALE },
                { label: "Unknown", value: summary.capabilityFreshness.UNKNOWN }
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 p-4">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Redirect Reasons */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
            <div className="bg-muted/10 border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Redirect reasons</h3>
            </div>
            {redirectRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No redirects recorded.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {redirectRows.map(({ reason, count }) => (
                  <div key={reason} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{reason}</span>
                    <span className="text-sm font-medium tabular-nums text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </section>

      <footer className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
        <CheckCircle2 className="size-3.5 text-success/80" aria-hidden="true" />
        No clinical details are shown in this supervisory summary.
      </footer>
    </PageShell>
  );
}
