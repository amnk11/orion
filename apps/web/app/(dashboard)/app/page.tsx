"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FilePlus2, ArrowRight, Activity, Clock, Inbox } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PageHeader } from "~/components/orion/page-header";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "~/components/ui/empty";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { db } from "~/lib/offline/db";

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
  offlineSyncStatus?: string;
}

export default function MyReferralsPage() {
  const { data, isLoading, error } = useQuery<{ ok: boolean; data: Handoff[] }>({
    queryKey: ["handoffs"],
    queryFn: async () => {
      let serverHandoffs: Handoff[] = [];
      try {
        const res = await fetch("/api/v1/handoffs");
        if (res.ok) {
          const json = await res.json();
          serverHandoffs = json.data || [];
        }
      } catch (e) {
        // network failure, proceed to merge local
      }

      if (typeof window !== "undefined") {
        // Get local handoffs that are pending, syncing, failed, or conflict
        const localHandoffs = await db.localHandoffs
          .filter(h => h.syncStatus !== "synced")
          .toArray();
        
        // Remove from serverHandoffs any that match the client mutation (reconciliation safety)
        const serverIds = new Set(serverHandoffs.map(h => h.id));
        const localsToMerge = localHandoffs.filter(lh => !serverIds.has(lh.id)).map(lh => ({
          id: lh.id,
          publicCode: lh.publicCode || "PENDING SYNC",
          patientId: lh.patientId,
          destinationFacilityId: lh.payload.destinationFacilityId,
          protocolCode: lh.payload.protocolCode,
          urgency: "local",
          state: lh.syncStatus === "failed" || lh.syncStatus === "conflict" ? "error" : "offline_queue",
          createdAt: lh.createdAt,
          packetJson: lh.payload.packetJson,
          offlineSyncStatus: lh.syncStatus,
        } as Handoff));

        return { ok: true, data: [...localsToMerge, ...serverHandoffs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
      }

      return { ok: true, data: serverHandoffs };
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <PageHeader 
        title="My Referrals" 
        description="Track and manage outbound patient handoffs."
        action={
          <Link href="/app/new/patient">
            <Button>
              <FilePlus2 className="size-4 mr-2" />
              New Referral
            </Button>
          </Link>
        }
      />

      {/* Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="sticky top-0 bg-surface-inset z-10 shadow-sm border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-muted-foreground w-12">Level</TableHead>
              <TableHead className="font-semibold text-muted-foreground">ID & Patient</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Protocol</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Created</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32">
                  <div className="flex flex-col items-center justify-center p-6 mx-auto max-w-sm rounded-lg bg-destructive/5 text-destructive text-center">
                    <span className="font-medium">Failed to load referrals</span>
                    <span className="text-sm opacity-90 mt-1">Please try again.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data?.data || data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64">
                  <Empty>
                    <EmptyMedia variant="icon"><Inbox className="text-muted-foreground" /></EmptyMedia>
                    <EmptyTitle>No referrals found</EmptyTitle>
                    <EmptyDescription>You haven't created any handoffs yet.</EmptyDescription>
                    <EmptyContent>
                      <Link href="/app/new/patient">
                        <Button variant="link" className="text-primary h-auto p-0 font-medium">
                          Create your first handoff &rarr;
                        </Button>
                      </Link>
                    </EmptyContent>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((handoff) => (
                <TableRow key={handoff.id}>
                  <TableCell>
                    <UrgencyBadge level={handoff.urgency} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{handoff.publicCode}</span>
                        {handoff.offlineSyncStatus && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            handoff.offlineSyncStatus === 'pending' ? 'bg-warning/10 text-warning-foreground border-warning/20' :
                            handoff.offlineSyncStatus === 'syncing' ? 'bg-info/10 text-info-foreground border-info/20' :
                            handoff.offlineSyncStatus === 'synced' ? 'bg-success/10 text-success-foreground border-success/20' :
                            'bg-destructive/10 text-destructive-foreground border-destructive/20'
                          }`}>
                            {handoff.offlineSyncStatus === 'pending' ? 'Saved Offline' : 
                             handoff.offlineSyncStatus === 'syncing' ? 'Syncing...' :
                             handoff.offlineSyncStatus === 'synced' ? 'Synced' : 'Sync Failed'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {handoff.patientName || handoff.packetJson?.demographics?.name || "Unknown Patient"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground/60" />
                      {handoff.protocolCode === "anc_danger" ? "ANC Danger Signs" : "Adult General"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StateBadge state={handoff.state} />
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5" />
                      {formatDistanceToNow(new Date(handoff.createdAt), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/app/handoff/${handoff.id}`} aria-label={`View details for ${handoff.publicCode}`}>
                      <Button variant="ghost" size="icon" className="transition-colors hover:bg-accent">
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
