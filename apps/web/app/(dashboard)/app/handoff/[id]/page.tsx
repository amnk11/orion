"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Clock, Activity, FileText, CheckCircle2, QrCode } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { ClinicalSummary } from "~/components/orion/clinical-summary";
import { Timeline } from "~/components/orion/timeline";
import { PatientSummary } from "~/components/orion/patient-summary";
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  const detail = data?.data;
  if (!detail) {
    return (
      <div className="p-8 text-center max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground">Handoff Not Found</h2>
        <Button variant="link" onClick={() => router.push("/app")} className="mt-4">Return to My Referrals</Button>
      </div>
    );
  }

  const { handoff, events, outcome, followUp } = detail;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
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
              {detail.offlineSyncStatus && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  detail.offlineSyncStatus === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  detail.offlineSyncStatus === 'syncing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  detail.offlineSyncStatus === 'synced' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {detail.offlineSyncStatus === 'pending' ? 'Saved Offline' : 
                   detail.offlineSyncStatus === 'syncing' ? 'Syncing...' :
                   detail.offlineSyncStatus === 'synced' ? 'Synced' : 'Sync Failed'}
                </span>
              )}
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
              <Button 
                variant="default" 
                className="gap-2 shadow-sm"
                onClick={() => {
                  fetch(`/api/v1/episodes/${handoff.episodeId}/close`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  }).then(async (res) => {
                    if (!res.ok) {
                      const err = await res.json();
                      toast.error(err.error?.message || "Failed to close episode");
                    } else {
                      toast.success("Episode closed successfully");
                      window.location.reload();
                    }
                  });
                }}
              >
                Close Episode
              </Button>
            )}
          </div>
        </div>
      </div>

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
            
            <Timeline events={events as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
