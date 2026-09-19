"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Clock, Activity, FileText, CheckCircle2, QrCode } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";

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
    details: { message?: string } | null;
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
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  const detail = data?.data;
  if (!detail) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Handoff Not Found</h2>
        <Button variant="link" onClick={() => router.push("/app")}>Return to My Referrals</Button>
      </div>
    );
  }

  const { handoff, events } = detail;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/app" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="size-4 mr-1" /> Back to My Referrals
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white font-mono">
                {handoff.publicCode}
              </h1>
              <Badge variant="outline" className="capitalize text-slate-600">
                {handoff.state.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <Clock className="size-4" /> Created {formatDistanceToNow(new Date(handoff.createdAt))} ago
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FileText className="size-4" /> Print Form
            </Button>
            <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
              <QrCode className="size-4" /> View QR
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="size-5 text-slate-500" /> Clinical Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Protocol</div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {handoff.protocolCode === "anc_danger" ? "ANC Danger Signs" : "Adult General"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Urgency</div>
                  <div className="flex items-center gap-2">
                    {handoff.urgency === "red" && <Badge className="bg-red-500 text-white border-transparent">Red Urgency</Badge>}
                    {handoff.urgency === "orange" && <Badge className="bg-orange-500 text-white border-transparent">Orange Urgency</Badge>}
                    {handoff.urgency === "green" && <Badge className="bg-emerald-500 text-white border-transparent">Green</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-500">Triage Data</div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 text-sm font-mono text-slate-600 dark:text-slate-400">
                  <pre>{JSON.stringify(handoff.packetJson, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="size-5 text-slate-400" /> Timeline
          </h3>
          
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
            {events.map((evt, index) => (
              <div key={evt.id} className="relative">
                <div className={`absolute -left-[33px] p-1 rounded-full bg-white dark:bg-slate-950 border-2 ${index === events.length - 1 ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700'}`}>
                  {index === events.length - 1 ? (
                    <Activity className="size-3 text-blue-500" />
                  ) : (
                    <CheckCircle2 className="size-3 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                    {evt.eventType.replace("_", " ")}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {format(new Date(evt.createdAt), "MMM d, h:mm a")}
                  </div>
                  {evt.details?.message && (
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-100 dark:border-slate-800">
                      {evt.details.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
