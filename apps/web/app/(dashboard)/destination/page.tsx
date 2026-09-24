"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronRight, Inbox, RefreshCw } from "lucide-react";
import { useSessionUser } from "~/hooks/use-session-user";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeader } from "~/components/orion/page-header";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "~/components/ui/empty";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";
import { QueueSection, LoadMoreRow } from "~/components/orion/queue-section";
import { ReferralQueueCard } from "~/components/orion/referral-queue-card";
import { WaitingAge } from "~/components/orion/waiting-age";
import { requiresDestinationDecision, segmentQueue } from "~/lib/operational-status";

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

interface Facility { id: string; name: string; tier?: string; type?: string; district?: string }

const URGENCY_SORT: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
};

/** Rows rendered per queue segment before the "show more" control is offered. */
const PAGE_SIZE = 25;

export default function DestinationInboxPage() {
  const router = useRouter();
  const { user, isPending, isDestination, isOrigin, isSupervisor } = useSessionUser();

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

  const { data: facilitiesResponse } = useQuery({
    queryKey: ["facilities", "names"],
    queryFn: async () => {
      const res = await fetch("/api/v1/facilities");
      if (!res.ok) throw new Error("Unable to load facility names");
      return res.json() as Promise<{ ok: boolean; data: Facility[] }>;
    },
    enabled: !!user && isDestination,
  });

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span>Verifying session...</span>
        </div>
      </main>
    );
  }

  if (!user || !isDestination) return null;

  const handoffs: Handoff[] = response?.data ?? [];
  const facilitiesById = new Map<string, Facility>(
    (facilitiesResponse?.data ?? []).map((facility: Facility) => [facility.id, facility])
  );

  // Sort: urgency priority -> newest first
  const sortedHandoffs = [...handoffs].sort((a, b) => {
    const urgencyA = URGENCY_SORT[a.urgency] || 99;
    const urgencyB = URGENCY_SORT[b.urgency] || 99;
    if (urgencyA !== urgencyB) return urgencyA - urgencyB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
  });

  const needsDecision = (handoff: Handoff) => requiresDestinationDecision(handoff.state);
  const { actionRequired, monitoring } = segmentQueue(sortedHandoffs, needsDecision);

  const [actionLimit, setActionLimit] = React.useState(PAGE_SIZE);
  const [monitorLimit, setMonitorLimit] = React.useState(PAGE_SIZE);

  const patientNameFor = (handoff: Handoff) =>
    handoff.patientName || handoff.packetJson?.demographics?.name || "Unknown patient";
  const protocolLabel = (code: string) => (code === "anc_danger" ? "ANC Danger Signs" : "Adult General");

  const OriginFacility = ({ facility }: { facility?: Facility }) => (
    <div className="min-w-0">
      <span className="block text-sm font-medium text-foreground">
        {facility?.name || "Origin facility not available"}
      </span>
      <span className="block text-xs text-muted-foreground">
        {facility?.tier ? facility.tier.toUpperCase() : "Tier unknown"}
        {facility?.district ? ` · ${facility.district}` : ""}
      </span>
    </div>
  );

  const renderMobileRows = (rows: Handoff[]) => (
    <div className="divide-y divide-border px-4 md:hidden">
      {rows.map((handoff) => (
        <ReferralQueueCard
          key={handoff.id}
          href={`/destination/handoff/${handoff.id}`}
          publicCode={handoff.publicCode}
          patientName={patientNameFor(handoff)}
          urgency={handoff.urgency}
          state={handoff.state}
          createdAt={handoff.createdAt}
          actionRequired={needsDecision(handoff)}
          secondary={<OriginFacility facility={facilitiesById.get(handoff.originFacilityId)} />}
        />
      ))}
    </div>
  );

  const InboxTableRow = ({ handoff }: { handoff: Handoff }) => {
    const decisionNeeded = needsDecision(handoff);

    return (
      <TableRow>
        <TableCell>
          <UrgencyBadge level={handoff.urgency} />
        </TableCell>
        <TableCell className="whitespace-normal">
          <div className="flex max-w-[220px] flex-col gap-1">
            <span className="font-mono text-sm text-muted-foreground">{handoff.publicCode}</span>
            <span className="text-sm font-medium text-foreground">{patientNameFor(handoff)}</span>
          </div>
        </TableCell>
        <TableCell className="whitespace-normal">
          <OriginFacility facility={facilitiesById.get(handoff.originFacilityId)} />
        </TableCell>
        <TableCell className="hidden text-muted-foreground xl:table-cell">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground/60" aria-hidden="true" />
            {protocolLabel(handoff.protocolCode)}
          </div>
        </TableCell>
        <TableCell>
          <WaitingAge createdAt={handoff.createdAt} />
        </TableCell>
        <TableCell>
          <StateBadge state={handoff.state} />
        </TableCell>
        <TableCell className="text-right">
          <Link href={`/destination/handoff/${handoff.id}`}>
            <Button variant={decisionNeeded ? "default" : "outline"} size="sm">
              {decisionNeeded ? "Review & act" : "Review referral"}
              <ChevronRight className="ml-1 size-4" aria-hidden="true" />
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
            <TableHead className="font-semibold text-muted-foreground">Origin</TableHead>
            <TableHead className="hidden font-semibold text-muted-foreground xl:table-cell">Protocol</TableHead>
            <TableHead className="font-semibold text-muted-foreground">Waiting</TableHead>
            <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="text-right font-semibold text-muted-foreground">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((handoff) => (
            <InboxTableRow key={handoff.id} handoff={handoff} />
          ))}
        </TableBody>
      </Table>
    </div>
  );


  return (
    <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      <PageHeader
        title="Destination Inbox"
        description="Incoming patient referrals assigned to your facility."
      />

      {isLoadingHandoffs && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-8 text-center">
          <span className="font-medium text-danger">The inbox could not be loaded</span>
          <span className="text-sm text-muted-foreground">
            No referral has been changed, accepted, or declined — this is a display failure only. Check the
            connection, then retry.
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="size-4" aria-hidden="true" /> Retry
          </Button>
        </div>
      )}

      {!isLoadingHandoffs && !error && handoffs.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12">
          <Empty>
            <EmptyMedia variant="icon"><Inbox className="text-muted-foreground/60" /></EmptyMedia>
            <EmptyTitle>No incoming referrals</EmptyTitle>
            <EmptyDescription>
              Nothing has been referred to your facility yet. New referrals appear here as soon as an origin
              facility dispatches them.
            </EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onClick={() => refetch()}>Refresh inbox</Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {!isLoadingHandoffs && !error && handoffs.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground" role="status">
            Showing {handoffs.length} incoming referral{handoffs.length === 1 ? "" : "s"} — {actionRequired.length}{" "}
            need{actionRequired.length === 1 ? "s" : ""} a destination decision.
          </p>

          {actionRequired.length > 0 && (
            <QueueSection
              id="needs-decision"
              tone="action"
              title="Needs a destination decision"
              description="Acknowledge receipt, then accept the patient or record why you cannot."
              count={actionRequired.length}
            >
              {renderMobileRows(actionRequired.slice(0, actionLimit))}
              {renderTable(actionRequired.slice(0, actionLimit))}
              <div className="px-4">
                <LoadMoreRow
                  remaining={actionRequired.length - actionLimit}
                  onClick={() => setActionLimit((n) => n + PAGE_SIZE)}
                  label="Show more referrals needing a decision"
                />
              </div>
            </QueueSection>
          )}

          {monitoring.length > 0 && (
            <QueueSection
              id="accepted-in-progress"
              tone="monitor"
              title="Accepted & in progress"
              description="Referrals your facility already owns. No decision is needed from this desk."
              count={monitoring.length}
            >
              {renderMobileRows(monitoring.slice(0, monitorLimit))}
              {renderTable(monitoring.slice(0, monitorLimit))}
              <div className="px-4">
                <LoadMoreRow
                  remaining={monitoring.length - monitorLimit}
                  onClick={() => setMonitorLimit((n) => n + PAGE_SIZE)}
                  label="Show more in-progress referrals"
                />
              </div>
            </QueueSection>
          )}
        </div>
      )}
    </div>
  );
}

