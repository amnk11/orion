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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
            <Activity className="size-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
              Destination Inbox
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.facilityId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</span>
            <span className="text-xs text-slate-500 capitalize">{user.role}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="size-4" /> 
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
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
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent shadow-none">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                <FileText className="size-8 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No pending handoffs</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Your facility is all clear. Incoming patient referrals will appear here automatically.
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Refresh Inbox
              </Button>
            </CardContent>
          </Card>
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
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${handoff.urgency === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""}
                              ${handoff.urgency === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : ""}
                              ${handoff.urgency === "green" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
                            `}
                          >
                            {handoff.urgency}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm text-slate-500">{handoff.publicCode}</span>
                          <span className="text-sm font-medium">
                            {handoff.patientName || handoff.packetJson?.demographics?.name || "Synthetic Patient"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm" title={handoff.originFacilityId}>
                          {handoff.originFacilityId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock className="size-3.5" />
                          <span>{formatDistanceToNow(new Date(handoff.createdAt))}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize bg-white dark:bg-slate-950">
                          {handoff.state.replace("_", " ")}
                        </Badge>
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
    </main>
  );
}
