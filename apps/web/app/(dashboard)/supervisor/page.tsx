"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { useSessionUser } from "~/hooks/use-session-user";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

interface DashboardSummary {
  stateCounts: Record<string, number>;
  ageing: Record<string, number>;
  redirectReasons: Record<string, number>;
  noShowRate: number;
  outcomeRate: number;
  followUps: { total: number; completed: number; overdue: number; pending: number };
  capabilityFreshness: { FRESH: number; STALE: number; VERY_STALE: number; UNKNOWN: number };
}

interface MetricCardProps {
  label: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}

function MetricCard({ label, count, description, icon, tone = "default" }: MetricCardProps) {
  const toneClass = tone === "danger" ? "border-danger/30 bg-danger/5" : tone === "warning" ? "border-warning/30 bg-warning/5" : "border-border bg-card";
  return <section className={`rounded-lg border p-4 ${toneClass}`} aria-label={`${label}: ${count}`}><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{label}</p><span className="text-muted-foreground" aria-hidden="true">{icon}</span></div><p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{count}</p><p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p></section>;
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

  if (isPending || summaryQuery.isLoading) return <main className="flex flex-1 items-center justify-center p-4"><div className="flex items-center gap-3 text-muted-foreground"><Spinner className="size-5" /><span>Loading operational summary…</span></div></main>;
  if (!user || !isSupervisor) return null;
  if (summaryQuery.error) return <main className="mx-auto flex w-full max-w-7xl flex-1 items-center p-4 md:p-8"><section className="max-w-xl rounded-lg border border-danger/30 bg-danger/5 p-6" role="alert"><h1 className="text-lg font-semibold text-foreground">Dashboard unavailable</h1><p className="mt-2 text-sm text-muted-foreground">The operational summary could not be loaded. Check the connection and try again.</p><Button className="mt-4" variant="outline" onClick={() => void summaryQuery.refetch()}><RefreshCw className="mr-2 size-4" />Try again</Button></section></main>;

  const summary = summaryQuery.data;
  if (!summary) return null;
  const attention = [
    { label: "Overdue follow-ups", count: summary.followUps.overdue, description: "Follow-up work past its recorded due date.", icon: <Clock3 className="size-5" />, tone: "danger" as const },
    { label: "Pending referrals", count: summary.stateCounts.pending ?? 0, description: "Referrals awaiting the next operational transition.", icon: <AlertTriangle className="size-5" />, tone: "warning" as const },
    { label: "Cannot accept", count: summary.stateCounts.cannot_accept ?? 0, description: "Referrals that need a redirect or escalation.", icon: <ShieldAlert className="size-5" />, tone: "warning" as const },
    { label: "Very stale capabilities", count: summary.capabilityFreshness.VERY_STALE ?? 0, description: "Capability reports that should be refreshed before reliance.", icon: <WifiOff className="size-5" />, tone: "warning" as const },
  ];
  const ageingRows: Array<{ bucket: string; count: number }> = Object.entries(summary.ageing).map(([bucket, count]) => ({ bucket, count }));
  const redirectRows: Array<{ reason: string; count: number }> = Object.entries(summary.redirectReasons).map(([reason, count]) => ({ reason, count }));

  return <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
    <header className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Supervisor view</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Operational intervention</h1><p className="mt-2 text-base text-muted-foreground">Start with work that needs follow-up, a destination decision, or refreshed information.</p></header>
    <section aria-labelledby="attention-heading"><div className="mb-3 flex items-baseline justify-between gap-3"><h2 id="attention-heading" className="text-lg font-semibold text-foreground">Needs attention</h2><p className="text-sm text-muted-foreground">Counts only; this summary does not expose record-level drill-down.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{attention.map((item) => <MetricCard key={item.label} {...item} />)}</div></section>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-border bg-card" aria-labelledby="ageing-heading"><div className="border-b border-border px-5 py-4"><h2 id="ageing-heading" className="font-semibold text-foreground">Waiting time for pending referrals</h2><p className="mt-1 text-sm text-muted-foreground">Age is reported by the service; the UI does not add escalation targets.</p></div><div className="divide-y divide-border">{ageingRows.map(({ bucket, count }) => <div key={bucket} className="flex items-center justify-between gap-4 px-5 py-3"><span className="text-sm text-foreground">{bucket}</span><span className="font-semibold tabular-nums text-foreground">{count}</span></div>)}</div></section>
      <section className="rounded-lg border border-border bg-card" aria-labelledby="followups-heading"><div className="border-b border-border px-5 py-4"><h2 id="followups-heading" className="font-semibold text-foreground">Follow-up operations</h2><p className="mt-1 text-sm text-muted-foreground">Completion status for this supervisor’s facility.</p></div><dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">{[{ label: "Pending", value: summary.followUps.pending }, { label: "Overdue", value: summary.followUps.overdue }, { label: "Completed", value: summary.followUps.completed }, { label: "Outcome rate", value: `${summary.outcomeRate}%` }].map(({ label, value }) => <div key={label} className="p-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</dd></div>)}</dl></section>
      <section className="rounded-lg border border-border bg-card" aria-labelledby="capabilities-heading"><div className="border-b border-border px-5 py-4"><h2 id="capabilities-heading" className="font-semibold text-foreground">Capability freshness</h2><p className="mt-1 text-sm text-muted-foreground">Freshness is an attestation signal, not live availability.</p></div><dl className="grid grid-cols-2 divide-x divide-y divide-border">{[{ label: "Fresh", value: summary.capabilityFreshness.FRESH }, { label: "Stale", value: summary.capabilityFreshness.STALE }, { label: "Very stale", value: summary.capabilityFreshness.VERY_STALE }, { label: "Unknown", value: summary.capabilityFreshness.UNKNOWN }].map(({ label, value }) => <div key={label} className="p-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</dd></div>)}</dl></section>
      <section className="rounded-lg border border-border bg-card" aria-labelledby="redirects-heading"><div className="border-b border-border px-5 py-4"><h2 id="redirects-heading" className="font-semibold text-foreground">Redirect reasons</h2><p className="mt-1 text-sm text-muted-foreground">Reasons recorded by the workflow.</p></div>{redirectRows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No redirects recorded.</p> : <div className="divide-y divide-border">{redirectRows.map(({ reason, count }) => <div key={reason} className="flex items-center justify-between gap-4 px-5 py-3"><span className="text-sm text-foreground">{reason}</span><span className="font-semibold tabular-nums text-foreground">{count}</span></div>)}</div>}</section>
    </div>
    <footer className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-success" aria-hidden="true" />No clinical details are shown in this supervisory summary.</footer>
  </main>;
}
