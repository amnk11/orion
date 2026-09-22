"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSessionUser } from "~/hooks/use-session-user";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, Clock, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
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

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const { user, isPending, isOrigin, isDestination, isSupervisor } = useSessionUser();

  React.useEffect(() => {
    if (!isPending) {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (isOrigin) router.replace("/app");
      else if (isDestination) router.replace("/destination");
      else if (!isSupervisor) router.replace("/login");
    }
  }, [user, isPending, router, isOrigin, isDestination, isSupervisor]);

  const { data: summary, isLoading: isSummaryLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/summary");
      const json = await res.json();
      return json.data;
    },
    enabled: !!isSupervisor,
  });

  if (isPending || isSummaryLoading) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span>Loading dashboard metrics...</span>
        </div>
      </main>
    );
  }

  if (!user || !isSupervisor || !summary) return null;

  if (error) {
    return (
      <main className="flex-1 p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Error loading dashboard: {error.message}
        </div>
      </main>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Supervisor Dashboard</h1>
        <p className="text-muted-foreground">
          Operational visibility and district-wide referral metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        {/* KPI Cards */}
        <div className="p-6 bg-card border rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">Pending Referrals</span>
            <Clock className="size-4" />
          </div>
          <p className="text-3xl font-semibold">{summary.stateCounts.pending || 0}</p>
        </div>

        <div className="p-6 bg-card border rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">Redirected</span>
            <AlertTriangle className="size-4" />
          </div>
          <p className="text-3xl font-semibold">{summary.stateCounts.redirected || 0}</p>
        </div>

        <div className="p-6 bg-card border rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">No-Shows</span>
            <XCircle className="size-4 text-destructive" />
          </div>
          <p className="text-3xl font-semibold">{summary.stateCounts.no_show || 0}</p>
          <p className="text-xs text-muted-foreground">{summary.noShowRate}% rate</p>
        </div>

        <div className="p-6 bg-card border rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm font-medium">Overdue Follow-ups</span>
            <CheckCircle className="size-4 text-orange-500" />
          </div>
          <p className="text-3xl font-semibold">{summary.followUps.overdue}</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Ageing Buckets */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Referral Ageing (Pending)</h2>
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Bucket</th>
                  <th className="px-4 py-3 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(summary.ageing).map(([bucket, count]) => (
                  <tr key={bucket}>
                    <td className="px-4 py-3">{bucket}</td>
                    <td className="px-4 py-3 text-right font-medium">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Capability Freshness */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Capability Freshness</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">FRESH</span>
              <p className="text-2xl font-bold mt-1">{summary.capabilityFreshness.FRESH}</p>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20">
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">STALE</span>
              <p className="text-2xl font-bold mt-1">{summary.capabilityFreshness.STALE}</p>
            </div>
            <div className="p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">VERY STALE</span>
              <p className="text-2xl font-bold mt-1">{summary.capabilityFreshness.VERY_STALE}</p>
            </div>
            <div className="p-4 border rounded-lg bg-muted">
              <span className="text-xs font-semibold text-muted-foreground">UNKNOWN</span>
              <p className="text-2xl font-bold mt-1">{summary.capabilityFreshness.UNKNOWN}</p>
            </div>
          </div>
        </div>

        {/* Redirect Reasons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Redirect Reasons</h2>
          <div className="border rounded-lg overflow-hidden bg-card">
            {Object.keys(summary.redirectReasons).length === 0 ? (
               <div className="p-6 text-center text-sm text-muted-foreground">No redirects recorded</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(summary.redirectReasons).map(([reason, count]) => (
                    <tr key={reason}>
                      <td className="px-4 py-3 font-mono text-xs">{reason}</td>
                      <td className="px-4 py-3 text-right font-medium">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Follow-up Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Follow-up Operations</h2>
          <div className="grid grid-cols-3 gap-4">
             <div className="p-4 border rounded-lg bg-card">
              <span className="text-xs font-medium text-muted-foreground">Pending</span>
              <p className="text-xl font-semibold mt-1">{summary.followUps.pending}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <span className="text-xs font-medium text-muted-foreground">Completed</span>
              <p className="text-xl font-semibold mt-1">{summary.followUps.completed}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <span className="text-xs font-medium text-muted-foreground">Outcome Rate</span>
              <p className="text-xl font-semibold mt-1">{summary.outcomeRate}%</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
