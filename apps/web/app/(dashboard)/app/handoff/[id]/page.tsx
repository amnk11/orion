"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Clock, Activity, FileText, CheckCircle2, QrCode } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { Timeline } from "~/components/orion/timeline";
import { PatientSummary } from "~/components/orion/patient-summary";
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";

interface HandoffDetail {
  handoff: {
    id: string;
    publicCode: string;
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
}

export default function HandoffDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data, isLoading } = useQuery<{ ok: boolean; data: HandoffDetail }>({
    queryKey: ["handoffs", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch handoff");
      return res.json();
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

  const { handoff, events } = detail;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      {/* Header */}
      <div>
        <Link href="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="size-4 mr-1" /> Back to My Referrals
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground font-mono">
                {handoff.publicCode}
              </h1>
              <StateBadge state={handoff.state} />
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="size-4" /> Created {formatDistanceToNow(new Date(handoff.createdAt))} ago
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 shadow-sm">
              <FileText className="size-4" /> Print Form
            </Button>
            <Button className="gap-2 shadow-sm">
              <QrCode className="size-4" /> View QR
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 flex-1">
        {/* Left Column: Details */}
        <div className="md:col-span-2 flex flex-col gap-8">
          <PatientSummary 
            publicCode={handoff.publicCode}
            name={(handoff.packetJson?.demographics as any)?.name}
            age={(handoff.packetJson?.demographics as any)?.age}
            sex={(handoff.packetJson?.demographics as any)?.sex}
            protocolCode={handoff.protocolCode}
            urgency={handoff.urgency}
          />
          
          <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
            <div className="bg-muted/50 border-b border-border p-4">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Activity className="size-5 text-muted-foreground" /> Clinical Context
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Triage Data</div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(handoff.packetJson, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Clock className="size-5 text-muted-foreground" /> Timeline
          </h3>
          
          <Timeline events={events as any} />
        </div>
      </div>
    </div>
  );
}
