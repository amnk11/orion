"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FilePlus2, Search, ArrowRight, Activity, Clock, Inbox } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { PageHeader } from "~/components/orion/page-header";
import { EmptyState } from "~/components/orion/empty-state";
import { UrgencyBadge } from "~/components/orion/urgency-badge";
import { StateBadge } from "~/components/orion/state-badge";

interface Handoff {
  id: string;
  publicCode: string;
  patientId: string;
  destinationFacilityId: string;
  protocolCode: string;
  urgency: string;
  state: string;
  createdAt: string;
  patientName?: string;
  packetJson?: any;
}

export default function MyReferralsPage() {
  const { data, isLoading, error } = useQuery<{ ok: boolean; data: Handoff[] }>({
    queryKey: ["handoffs"],
    queryFn: async () => {
      const res = await fetch("/api/v1/handoffs");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="My Referrals" 
        description="Track and manage outbound patient handoffs."
        action={
          <Link href="/app/new/patient">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <FilePlus2 className="size-4 mr-2" />
              New Referral
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by ID or Patient..."
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">ID & Patient</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Urgency</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-500">
                    Failed to load referrals. Please try again.
                  </td>
                </tr>
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState 
                      title="No referrals found" 
                      description="You haven't created any handoffs yet."
                      action={
                        <Link href="/app/new/patient">
                          <Button variant="link" className="text-blue-600 h-auto p-0">
                            Create your first handoff &rarr;
                          </Button>
                        </Link>
                      }
                    />
                  </td>
                </tr>
              ) : (
                data.data.map((handoff) => (
                  <tr key={handoff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm text-slate-500">{handoff.publicCode}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {handoff.patientName || handoff.packetJson?.demographics?.name || "Synthetic Patient"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Activity className="size-4 text-slate-400" />
                        {handoff.protocolCode === "anc_danger" ? "ANC Danger Signs" : "Adult General"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UrgencyBadge level={handoff.urgency} />
                    </td>
                    <td className="px-6 py-4">
                      <StateBadge state={handoff.state} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 tabular-nums">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5" />
                        {formatDistanceToNow(new Date(handoff.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/app/handoff/${handoff.id}`}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
