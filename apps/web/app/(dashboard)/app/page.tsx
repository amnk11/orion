"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FilePlus2, ArrowRight, Activity, Inbox, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PageHeader } from "~/components/orion/page-header";
import { PageShell } from "~/components/orion/page-shell";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "~/components/ui/empty";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";
import { SyncStatus, toSyncStatus } from "~/components/ui/sync-status";
import { QueueSection, LoadMoreRow } from "~/components/orion/queue-section";
import { ReferralQueueCard } from "~/components/orion/referral-queue-card";
import { WaitingAge } from "~/components/orion/waiting-age";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { db } from "~/lib/offline/db";
import { isLocalOnlyState, requiresOriginAction, segmentQueue } from "~/lib/operational-status";

/** Rows rendered per queue segment before the "show more" control is offered. */
const PAGE_SIZE = 25;

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

/** Shape of a referral that exists only in the local offline queue. */
interface LocalHandoffRow {
  id: string;
  publicCode?: string;
  patientId: string;
  createdAt: string;
  syncStatus: string;
  payload: {
    destinationFacilityId: string;
    protocolCode: string;
    packetJson?: any;
  };
}

export default function MyReferralsPage() {
  const { data, isLoading, error, refetch } = useQuery<{ ok: boolean; data: Handoff[] }>({
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
        const localHandoffs: LocalHandoffRow[] = await db.localHandoffs
          .filter((h: LocalHandoffRow) => h.syncStatus !== "synced")
          .toArray();
        
        // Remove from serverHandoffs any that match the client mutation (reconciliation safety)
        const serverIds = new Set(serverHandoffs.map((h: Handoff) => h.id));
        const localsToMerge = localHandoffs.filter((lh: LocalHandoffRow) => !serverIds.has(lh.id)).map((lh: LocalHandoffRow) => ({
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

  const handoffs = data?.data ?? [];
  const protocolLabel = (code: string) => (code === "anc_danger" ? "ANC Danger Signs" : "Adult General");
  const needsAction = (handoff: Handoff) =>
    requiresOriginAction(handoff.state) || isLocalOnlyState(handoff.state);
  const { actionRequired, monitoring } = segmentQueue(handoffs, needsAction);

  const [actionLimit, setActionLimit] = React.useState(PAGE_SIZE);
  const [monitorLimit, setMonitorLimit] = React.useState(PAGE_SIZE);

  const patientNameFor = (handoff: Handoff) =>
    handoff.patientName || handoff.packetJson?.demographics?.name || "Unknown patient";

  const renderMobileRows = (rows: Handoff[]) => (
    <div className="divide-y divide-border px-4 md:hidden">
      {rows.map((handoff) => (
        <ReferralQueueCard
          key={handoff.id}
          href={`/app/handoff/${handoff.id}`}
          publicCode={handoff.publicCode}
          patientName={patientNameFor(handoff)}
          urgency={handoff.urgency}
          state={handoff.state}
          createdAt={handoff.createdAt}
          syncStatus={handoff.offlineSyncStatus}
          actionRequired={needsAction(handoff)}
          secondary={
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Activity className="size-4 shrink-0" aria-hidden="true" />
              {protocolLabel(handoff.protocolCode)}
            </span>
          }
        />
      ))}
    </div>
  );

  const OriginTableRow = ({ handoff }: { handoff: Handoff }) => {
    const sync = toSyncStatus(handoff.offlineSyncStatus);
    const actionNeeded = needsAction(handoff);

    return (
      <TableRow>
        <TableCell>
          <UrgencyBadge level={handoff.urgency} />
        </TableCell>
        <TableCell className="whitespace-normal">
          <div className="flex max-w-[220px] flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{handoff.publicCode}</span>
              {sync && <SyncStatus status={sync} compact />}
            </div>
            <span className="text-sm font-medium text-foreground">{patientNameFor(handoff)}</span>
          </div>
        </TableCell>
        <TableCell className="hidden text-muted-foreground xl:table-cell">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground/60" aria-hidden="true" />
            {protocolLabel(handoff.protocolCode)}
          </div>
        </TableCell>
        <TableCell>
          <StateBadge state={handoff.state} />
        </TableCell>
        <TableCell>
          <WaitingAge createdAt={handoff.createdAt} />
        </TableCell>
        <TableCell className="text-right">
          <Link href={`/app/handoff/${handoff.id}`}>
            <Button variant={actionNeeded ? "default" : "outline"} size="sm">
              {actionNeeded ? "Review & act" : "Review"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = (rows: Handoff[]) => (
    <div className="hidden md:block">
      <Table>
        <TableHeader className="bg-surface-inset">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 font-semibold text-muted-foreground">Level</TableHead>
            <TableHead className="font-semibold text-muted-foreground">ID &amp; Patient</TableHead>
            <TableHead className="hidden font-semibold text-muted-foreground xl:table-cell">Protocol</TableHead>
            <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="font-semibold text-muted-foreground">Waiting</TableHead>
            <TableHead className="text-right font-semibold text-muted-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((handoff) => (
            <OriginTableRow key={handoff.id} handoff={handoff} />
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <PageShell maxWidth="standard">
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

      {isLoading && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-8 text-center">
          <span className="font-medium text-danger">Referrals could not be loaded</span>
          <span className="text-sm text-muted-foreground">
            Nothing was changed or lost — referrals saved on this device are still on this device. Check the
            connection, then retry.
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="size-4" aria-hidden="true" /> Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && handoffs.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12">
          <Empty>
            <EmptyMedia variant="icon"><Inbox className="text-muted-foreground/60" /></EmptyMedia>
            <EmptyTitle>No referrals found</EmptyTitle>
            <EmptyDescription>You have not created any referrals yet.</EmptyDescription>
            <EmptyContent>
              <Link href="/app/new/patient">
                <Button variant="link" className="text-primary h-auto p-0 font-medium">
                  Create your first referral &rarr;
                </Button>
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {handoffs.some(h => h.offlineSyncStatus === "failed") && (
        <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 p-4">
          <div className="flex items-center gap-2">
             <span className="font-medium text-danger">Some offline referrals failed to sync.</span>
             <span className="text-sm text-danger/80">They remain on this device.</span>
          </div>
          <Button variant="default" size="sm" onClick={async () => {
             const { syncEngine } = await import("~/lib/offline/sync-engine");
             await syncEngine.forceRetryAll();
             refetch();
          }}>
            Retry failed syncs
          </Button>
        </div>
      )}

      {!isLoading && !error && handoffs.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground" role="status">
            Showing {handoffs.length} referral{handoffs.length === 1 ? "" : "s"} — {actionRequired.length} {actionRequired.length === 1 ? "needs" : "need"} your action.
          </p>

          {actionRequired.length > 0 && (
            <QueueSection
              id="needs-action"
              tone="action"
              title="Needs your action"
              description="Patients who did not arrive, outcomes waiting to be closed, or referrals saved only on this device."
              count={actionRequired.length}
            >
              {renderMobileRows(actionRequired.slice(0, actionLimit))}

              {renderTable(actionRequired.slice(0, actionLimit))}
              <div className="px-4">
                <LoadMoreRow
                  remaining={actionRequired.length - actionLimit}
                  onClick={() => setActionLimit((n) => n + PAGE_SIZE)}
                  label="Show more action-required referrals"
                />
              </div>
            </QueueSection>
          )}

          {monitoring.length > 0 && (
            <QueueSection
              id="monitoring"
              tone="monitor"
              title="Monitoring & history"
              description="Referrals already moving through the destination facility. No action is needed from this desk."
              count={monitoring.length}
            >
              {renderMobileRows(monitoring.slice(0, monitorLimit))}
              {renderTable(monitoring.slice(0, monitorLimit))}
              <div className="px-4">
                <LoadMoreRow
                  remaining={monitoring.length - monitorLimit}
                  onClick={() => setMonitorLimit((n) => n + PAGE_SIZE)}
                  label="Show more monitored referrals"
                />
              </div>
            </QueueSection>
          )}
        </div>
      )}
    </PageShell>
  );
}

