"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { useSessionUser } from "~/hooks/use-session-user";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { MetricCard } from "~/components/orion/metric-card";
import { PageShell } from "~/components/orion/page-shell";
import { PageHeader } from "~/components/orion/page-header";

interface DashboardSummary {
  stateCounts: Record<string, number>;
  ageing: Record<string, number>;
  redirectReasons: Record<string, number>;
  noShowRate: number;
  // BUG-08 FIX: outcomeRate is null when there are no arrived/in_care/outcome referrals.
  outcomeRate: number | null;
  followUps: { total: number; completed: number; overdue: number; pending: number };
  capabilityFreshness: { FRESH: number; STALE: number; VERY_STALE: number; UNKNOWN: number; total: number };
}

export default function SupervisorDashboardPage() {
  const router = useRouter();
  // BUG-05 FIX: Destructure isAdmin — it is now used in the guard and query below.
  const { user, isPending, isOrigin, isDestination, isSupervisor, isAdmin } =
    useSessionUser();

  // BUG-02 FIX: Admin users are allowed on the supervisor route (matches layout + API).
  React.useEffect(() => {
    if (!isPending) {
      if (!user) router.replace("/login");
      else if (isOrigin) router.replace("/app");
      else if (isDestination) router.replace("/destination");
      // BUG-05 FIX: isAdmin added to dependency array and guard condition.
      else if (!isSupervisor && !isAdmin) router.replace("/login");
    }
  }, [user, isPending, router, isOrigin, isDestination, isSupervisor, isAdmin]);

  const summaryQuery = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const response = await fetch("/api/v1/dashboard/summary");
      if (!response.ok) throw new Error("The dashboard summary could not be loaded.");
      return ((await response.json()) as { data: DashboardSummary }).data;
    },
    // BUG-02 FIX: Admin is also allowed to query.
    enabled: !!(isSupervisor || isAdmin),
  });

  // BUG-12 FIX: Use summaryQuery.isPending instead of deprecated summaryQuery.isLoading.
  // isLoading returns false during background refetches (causing a stale-then-loading flash).
  if (isPending || summaryQuery.isPending) {
    return (
      // BUG-11 FIX: Loading state rendered inside the scroll container, not a bare <main>.
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm">Loading operational summary…</span>
        </div>
      </div>
    );
  }

  // BUG-02 FIX: Guard includes isAdmin.
  if (!user || (!isSupervisor && !isAdmin)) return null;

  if (summaryQuery.error) {
    return (
      // BUG-11 FIX: Error state rendered inside the scroll container so it respects
      // the layout's padding and does not overlap the mobile nav bar.
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 items-center p-4 md:p-8">
        <section className="max-w-xl rounded-lg border border-danger/20 bg-danger/5 p-6" role="alert">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard unavailable</h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            The operational summary could not be loaded. Check the connection and try again.
          </p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void summaryQuery.refetch()}>
            <RefreshCw className="mr-2 size-4" /> Try again
          </Button>
        </section>
      </div>
    );
  }

  const summary = summaryQuery.data;
  if (!summary) return null;

  // BUG-04 FIX: Use MetricCard (the shared component) instead of the diverging inline divs.
  // This ensures consistent border widths, zero-de-emphasis, and aria-label on all cards.
  const attentionCards = [
    {
      label: "Overdue follow-ups",
      count: summary.followUps.overdue,
      description: "Follow-up work past its recorded due date.",
      icon: <Clock3 className="size-4" />,
      tone: "danger" as const,
    },
    {
      label: "Pending referrals",
      count: summary.stateCounts.pending ?? 0,
      description: "Referrals awaiting the next operational transition.",
      icon: <AlertTriangle className="size-4" />,
      tone: "warning" as const,
    },
    {
      label: "Cannot accept",
      count: summary.stateCounts.cannot_accept ?? 0,
      description: "Referrals that need a redirect or escalation.",
      icon: <ShieldAlert className="size-4" />,
      tone: "warning" as const,
    },
    {
      label: "Very stale capabilities",
      count: summary.capabilityFreshness.VERY_STALE ?? 0,
      description: "Capability reports that should be refreshed before reliance.",
      icon: <WifiOff className="size-4" />,
      tone: "warning" as const,
    },
  ];

  // ROOT CAUSE 2 FIX: Filter out zero-count buckets before rendering.
  // The service always returns all 5 ageing keys (e.g. "<1h": 0, "1-4h": 0 …),
  // so without this filter ageingRows.length was always 5 — the "No pending
  // referrals" empty-state message never appeared, and 5 rows of "0" were shown.
  const ageingRows = Object.entries(summary.ageing)
    .map(([bucket, count]) => ({ bucket, count }))
    .filter(({ count }) => count > 0);
  const redirectRows = Object.entries(summary.redirectReasons).map(
    ([reason, count]) => ({ reason, count })
  );

  // BUG-14 FIX: Detect when no capabilities have been reported for this facility.
  const totalCaps = summary.capabilityFreshness.total ?? 0;

  return (
    <PageShell maxWidth="wide" className="pb-20">

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-1.5 max-w-3xl">
        <p className="text-xs font-medium text-primary mb-1">Supervisor view</p>
        {/* BUG-10 FIX: PageHeader now renders <h1> for the page title (see page-header.tsx). */}
        <PageHeader
          title="Operational intervention"
          description="Start with work that needs follow-up, a destination decision, or refreshed information."
        />
      </div>

      {/* 2. NEEDS ATTENTION */}
      {/* BUG-04 FIX: Replaced inline divs with <MetricCard /> components. */}
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
          {attentionCards.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              count={item.count}
              description={item.description}
              icon={item.icon}
              tone={item.tone}
            />
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
                // BUG-08 FIX: Show "—" when outcomeRate is null (no arrived referrals yet).
                { label: "Outcome rate", value: summary.outcomeRate !== null ? `${summary.outcomeRate}%` : "—" },
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
            {/* BUG-14 FIX: Show an informative message when no capabilities are on record. */}
            {totalCaps === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No capability data reported for this facility yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 divide-x divide-y divide-border/50">
                {[
                  { label: "Fresh", value: summary.capabilityFreshness.FRESH },
                  { label: "Stale", value: summary.capabilityFreshness.STALE },
                  { label: "Very stale", value: summary.capabilityFreshness.VERY_STALE },
                  { label: "Unknown", value: summary.capabilityFreshness.UNKNOWN },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1 p-4">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
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
