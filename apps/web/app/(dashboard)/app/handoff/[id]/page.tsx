"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Clock, Activity, FileText, CheckCircle2, QrCode } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { ClinicalSummary } from "~/components/orion/clinical-summary";
import { StateGuidancePanel } from "~/components/orion/state-guidance";
import { Timeline } from "~/components/orion/timeline";
import { PatientSummary } from "~/components/orion/patient-summary";
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";
import { SyncStatus, toSyncStatus } from "~/components/ui/sync-status";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface HandoffDetail {
  handoff: {
    id: string;
    publicCode: string;
    episodeId: string;
    patientId: string;
    protocolCode: string;
    urgency: string;
    state: string;
    createdAt: string;
    packetJson: Record<string, unknown>;
  };
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    actorId?: string;
    actorRole?: string;
    facilityId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }>;
  outcome?: {
    disposition: string;
    summary: string;
    adviceSummary?: string;
    followUpDueAt?: string;
  };
  followUp?: {
    status: string;
    dueAt: string;
  };
}

export default function HandoffDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [closeError, setCloseError] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery<{ ok: boolean; data: HandoffDetail & { offlineSyncStatus?: string } }>({
    queryKey: ["handoffs", id],
    queryFn: async () => {
      // First try fetching from server
      try {
        const res = await fetch(`/api/v1/handoffs/${id}`);
        if (res.ok) return res.json();
      } catch (e) {
        // network failure, will fall through to check local DB
      }
      
      // If server fetch failed (404 or network error), check local Dexie DB
      if (typeof window !== "undefined") {
        const { db } = await import("~/lib/offline/db");
        const localHandoff = await db.localHandoffs.get(id);
        
        if (localHandoff) {
          return {
            ok: true,
            data: {
              handoff: {
                id: localHandoff.id,
                publicCode: localHandoff.publicCode || "PENDING SYNC",
                episodeId: localHandoff.episodeId,
                patientId: localHandoff.patientId,
                protocolCode: localHandoff.payload.protocolCode,
                urgency: "local", // or compute locally if needed
                state: "offline_queue",
                createdAt: localHandoff.createdAt,
                packetJson: localHandoff.payload.packetJson,
              },
              events: [],
              offlineSyncStatus: localHandoff.syncStatus,
            }
          };
        }
      }

      throw new Error("Failed to fetch handoff");
    },
  });

  // Facility names are needed so the timeline answers "who/where" instead of
  // exposing machine identifiers.
  const { data: facilitiesData } = useQuery({
    queryKey: ["facilities", "names"],
    queryFn: async () => {
      const res = await fetch("/api/v1/facilities");
      if (!res.ok) throw new Error("Unable to load facility names");
      return res.json() as Promise<{ ok: boolean; data: Array<{ id: string; name: string }> }>;
    },
  });
  const facilityNames = Object.fromEntries(
    (facilitiesData?.data ?? []).map((facility: { id: string; name: string }) => [facility.id, facility.name])
  );

  const handleCloseEpisode = async (episodeId: string) => {
    setIsClosing(true);
    setCloseError(null);
    try {
      const res = await fetch(`/api/v1/episodes/${episodeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        let apiMessage = "";
        try {
          const err = await res.json();
          apiMessage = err?.error?.message || "";
        } catch {
          apiMessage = "";
        }
        throw new Error(apiMessage || "The episode could not be closed.");
      }
      setCloseOpen(false);
      toast.success("Episode closed. The referral is now closed and no further action is expected.");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "The episode could not be closed.";
      setCloseError(
        `${message} The referral is unchanged and still open — nothing was lost. Check the connection and retry, or complete any pending follow-ups first.`
      );
      toast.error("Episode not closed. The referral is unchanged and still open.");
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  const detail = data?.data;
  if (!detail) {
    return (
      <div className="p-8 text-center max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground">Handoff Not Found</h2>
        <Button variant="link" onClick={() => router.push("/app")} className="mt-4">Return to My Referrals</Button>
      </div>
    );
  }

  const { handoff, events, outcome, followUp } = detail;
  const localSync = toSyncStatus(detail.offlineSyncStatus);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 h-full flex flex-col">
      {/* Header */}
      <div>
        <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="size-4 mr-1" /> Back to My Referrals
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground font-mono">
                {handoff.publicCode}
              </h1>
              {localSync && <SyncStatus status={localSync} />}
              {handoff.state !== "offline_queue" && <StateBadge state={handoff.state} />}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="size-4" /> Created {formatDistanceToNow(new Date(handoff.createdAt))} ago
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 shadow-sm" onClick={() => {
              window.open(`/api/v1/handoffs/${handoff.id}/fhir`, "_blank");
            }}>
              <FileText className="size-4" /> Export FHIR
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <QrCode className="size-4" /> View QR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Referral Status QR</DialogTitle>
                  <DialogDescription>
                    Scan this code to view the real-time public status of this referral. No clinical information is exposed.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center p-6 bg-white rounded-md mt-4">
                  <QRCodeSVG 
                    value={`${window.location.origin}/status/${handoff.publicCode}`} 
                    size={200}
                    level="H"
                  />
                </div>
                <div className="text-center text-sm font-mono text-muted-foreground mt-2">
                  {handoff.publicCode}
                </div>
              </DialogContent>
            </Dialog>

            {["no_show", "outcome_recorded", "follow_up_pending"].includes(handoff.state) && (
              <>
                <Button
                  variant="default"
                  className="gap-2 shadow-sm"
                  onClick={() => {
                    setCloseError(null);
                    setCloseOpen(true);
                  }}
                >
                  Close episode
                </Button>
                <Dialog open={closeOpen} onOpenChange={(open: boolean) => { if (!isClosing) setCloseOpen(open); }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Close this episode?</DialogTitle>
                      <DialogDescription>
                        Closing ends the referral episode for this patient. The record stays available for audit
                        but cannot be reopened — a new referral is required if the patient needs care again.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-sm text-muted-foreground space-y-2">
                      <p>Closing is only possible when no follow-up is still pending.</p>
                      {closeError && (
                        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 font-medium text-danger">
                          {closeError}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCloseOpen(false)} disabled={isClosing}>
                        Keep episode open
                      </Button>
                      <Button onClick={() => handleCloseEpisode(handoff.episodeId)} disabled={isClosing}>
                        {isClosing ? "Closing…" : "Close episode"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </div>

      <StateGuidancePanel state={handoff.state} role="origin" />

      <div className="flex flex-col gap-8 max-w-4xl w-full mx-auto pb-24">
        {/* 1. Patient Context */}
        <PatientSummary 
          publicCode={handoff.publicCode}
          name={(handoff as any).patientName || (handoff.packetJson?.demographics as any)?.name || "Unknown Patient"}
          age={(handoff as any).patientAge || (handoff.packetJson?.demographics as any)?.age}
          sex={(handoff as any).patientSex || (handoff.packetJson?.demographics as any)?.sex}
          protocolCode={handoff.protocolCode}
          urgency={handoff.urgency}
        />
        
        {/* 2. Clinical Summary */}
        <div className="flex flex-col border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="bg-muted/30 border-b border-border p-5">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Activity className="size-5 text-muted-foreground" /> Clinical Summary
            </h2>
          </div>
          <div className="p-6">
            <ClinicalSummary packet={handoff.packetJson} protocolCode={handoff.protocolCode} />
          </div>
        </div>

        {outcome && (
          <div className="flex flex-col border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="bg-muted/30 border-b border-border p-5">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" /> Destination Outcome
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Disposition</span>
                <p className="font-medium">{outcome.disposition}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Summary</span>
                <p>{outcome.summary}</p>
              </div>
              {outcome.adviceSummary && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Advice Summary</span>
                  <p>{outcome.adviceSummary}</p>
                </div>
              )}
              {outcome.followUpDueAt && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Follow-Up Due</span>
                  <p>{format(new Date(outcome.followUpDueAt), "PP")}</p>
                  {followUp && <span className="text-xs text-muted-foreground">Status: {followUp.status}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3 & 4. Destination & Timeline */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Destination Placeholder - we would normally show destination details here */}
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" /> Operational Timeline
            </h3>
            
              <Timeline events={events} facilityNames={facilityNames} />
          </div>
        </div>
      </div>
    </div>
  );
}

