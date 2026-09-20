"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Activity, LogOut, FileText, ChevronRight } from "lucide-react";
import { useSessionUser } from "~/hooks/use-session-user";
import { signOut } from "~/lib/auth/auth-client";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Spinner } from "~/components/ui/spinner";
import { Card, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeader } from "~/components/orion/page-header";
import { EmptyState } from "~/components/orion/empty-state";
import { UrgencyBadge } from "~/components/orion/urgency-badge";
import { StateBadge } from "~/components/orion/state-badge";

interface Handoff {
  id: string;
  publicCode: string;
  patientId: string;
  protocolCode: string;
  urgency: string;
  state: string;
  createdAt: string;
  packetJson: Record<string, any>;
  originFacilityId: string;
  currentDestinationFacilityId: string;
  patientName?: string;
}

const URGENCY_SORT: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
};

export default function DestinationInboxPage() {
  const router = useRouter();
  const { user, isPending, session, isDestination, isOrigin, isSupervisor } = useSessionUser();

  React.useEffect(() => {
    if (!isPending) {
      if (!user) {
        router.replace("/login");
      } else if (isOrigin) {
        router.replace("/app");
      } else if (isSupervisor) {
        router.replace("/supervisor");
      } else if (!isDestination) {
        router.replace("/login");
      }
    }
  }, [user, isPending, router, isDestination, isOrigin, isSupervisor]);

  const { data: response, isLoading: isLoadingHandoffs, error, refetch } = useQuery({
    queryKey: ["handoffs", "inbound"],
    queryFn: async () => {
      const res = await fetch("/api/v1/handoffs?role=inbound");
      if (!res.ok) throw new Error("Failed to fetch inbound handoffs");
      return res.json() as Promise<{ ok: boolean; data: Handoff[] }>;
    },
    enabled: !!user && isDestination,
  });

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex items-center gap-3 text-slate-500">
          <Spinner className="size-5" />
          <span>Verifying session...</span>
        </div>
      </main>
    );
  }

  if (!user || !isDestination) return null;

  const handoffs = response?.data || [];
  
  // Sort: urgency priority -> newest first
  const sortedHandoffs = [...handoffs].sort((a, b) => {
    const urgencyA = URGENCY_SORT[a.urgency] || 99;
    const urgencyB = URGENCY_SORT[b.urgency] || 99;
    if (urgencyA !== urgencyB) return urgencyA - urgencyB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Destination Inbox" 
        description="Incoming patient referrals assigned to your facility."
        action={
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm">
            <LogOut className="size-4 mr-2" />
            Switch Facility
          </Button>
        }
      />
      
      {/* State Handling */}
        {isLoadingHandoffs && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <Spinner className="size-8" />
            <p>Loading incoming handoffs...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-red-500 font-medium">Failed to load inbox</div>
              <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {!isLoadingHandoffs && !error && sortedHandoffs.length === 0 && (
          <EmptyState 
            title="No pending handoffs" 
            description="Your facility is all clear. Incoming patient referrals will appear here automatically."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Refresh Inbox
              </Button>
            }
          />
        )}

        {/* Handoff List */}
        {!isLoadingHandoffs && !error && sortedHandoffs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Protocol & Urgency</TableHead>
                    <TableHead>Patient / Code</TableHead>
                    <TableHead>Origin Facility</TableHead>
                    <TableHead>Waiting Time</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHandoffs.map((handoff) => (
                    <TableRow 
                      key={handoff.id} 
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => router.push(`/destination/handoff/${handoff.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {handoff.protocolCode === "anc_danger" ? "ANC Danger" : "Adult Gen"}
                          </span>
                          <UrgencyBadge level={handoff.urgency} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm text-slate-500">{handoff.publicCode}</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {handoff.patientName || handoff.packetJson?.demographics?.name || "Synthetic Patient"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                          {handoff.originFacilityId.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 tabular-nums">
                        <div className="flex items-center gap-2">
                          <Clock className="size-3.5" />
                          {formatDistanceToNow(new Date(handoff.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StateBadge state={handoff.state} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950">
                          Open <ChevronRight className="ml-1 size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
    </div>
  );
}
