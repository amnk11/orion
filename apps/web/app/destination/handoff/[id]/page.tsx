"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Clock, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Timeline } from "~/components/orion/timeline";
import { StateBadge } from "~/components/orion/state-badge";
import { UrgencyBadge } from "~/components/orion/urgency-badge";
import { PatientSummary } from "~/components/orion/patient-summary";

// Assuming reasons are string enums on backend
const CANNOT_ACCEPT_REASONS = [
  "specialist_unavailable",
  "bed_unavailable",
  "equipment_down",
  "out_of_scope",
  "other",
];

export default function DestinationHandoffDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const [cannotAcceptOpen, setCannotAcceptOpen] = React.useState(false);
  const [redirectOpen, setRedirectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [redirectTarget, setRedirectTarget] = React.useState("");

  const ackAttempted = React.useRef(false);
  const ackClientEventId = React.useRef(crypto.randomUUID());

  // Queries
  const { data: detailData, isLoading, refetch } = useQuery({
    queryKey: ["handoff", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch handoff");
      return res.json();
    },
  });

  const { data: facilitiesData } = useQuery({
    queryKey: ["facilities"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/facilities`);
      if (!res.ok) throw new Error("Failed to fetch facilities");
      return res.json();
    },
    enabled: redirectOpen,
  });

  const handoff = detailData?.data?.handoff;
  const events = detailData?.data?.events || [];

  // Mutations
  const ackMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: ackClientEventId.current }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      queryClient.invalidateQueries({ queryKey: ["handoffs", "inbound"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to accept");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      queryClient.invalidateQueries({ queryKey: ["handoffs", "inbound"] });
    },
    onError: (err: Error) => {
      alert(`Accept failed: ${err.message}`);
      refetch(); // Fetch latest state
    }
  });

  const cannotAcceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/cannot-accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to reject");
      }
      return res.json();
    },
    onSuccess: () => {
      setCannotAcceptOpen(false);
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      queryClient.invalidateQueries({ queryKey: ["handoffs", "inbound"] });
    },
    onError: (err: Error) => {
      alert(`Cannot Accept failed: ${err.message}`);
      refetch();
    }
  });

  const redirectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/redirect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDestinationFacilityId: redirectTarget, reason, clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to redirect");
      }
      return res.json();
    },
    onSuccess: () => {
      setRedirectOpen(false);
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      queryClient.invalidateQueries({ queryKey: ["handoffs", "inbound"] });
      // Go back to inbox since we don't own this handoff anymore
      router.push("/destination");
    },
    onError: (err: Error) => {
      alert(`Redirect failed: ${err.message}`);
      refetch();
    }
  });

  // Acknowledge on Open
  React.useEffect(() => {
    if (handoff && handoff.state === "sent" && !ackAttempted.current) {
      ackAttempted.current = true;
      ackMutation.mutate();
    }
  }, [handoff, ackMutation]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (!handoff) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-xl font-semibold mb-4">Handoff Not Found</h2>
        <Button onClick={() => router.push("/destination")}>Return to Inbox</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/destination" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="size-4 mr-1" /> Back to Inbox
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white font-mono">
                {handoff.publicCode}
              </h1>
              <StateBadge state={handoff.state} />
            </div>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <Clock className="size-4" /> Received {formatDistanceToNow(new Date(handoff.createdAt))} ago
            </p>
          </div>
          
          {/* Action Area */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            {handoff.state === "acknowledged" && (
              <>
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                  onClick={() => { setReason(""); setCannotAcceptOpen(true); }}
                  disabled={acceptMutation.isPending || cannotAcceptMutation.isPending}
                >
                  Cannot Accept
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || cannotAcceptMutation.isPending}
                >
                  {acceptMutation.isPending ? "Accepting..." : "Accept Patient"}
                </Button>
              </>
            )}

            {handoff.state === "cannot_accept" && (
              <Button 
                variant="default"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => { setReason(""); setRedirectTarget(""); setRedirectOpen(true); }}
                disabled={redirectMutation.isPending}
              >
                Redirect to another facility
              </Button>
            )}
            
            {["accepted", "arrived", "in_care", "outcome_recorded"].includes(handoff.state) && (
              <Badge className="bg-emerald-100 text-emerald-800 self-center mx-2 px-3 py-1">
                Accepted
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <PatientSummary 
            publicCode={handoff.publicCode}
            name={handoff.patientName || handoff.packetJson?.demographics?.name}
            age={handoff.packetJson?.demographics?.age}
            sex={handoff.packetJson?.demographics?.sex}
            protocolCode={handoff.protocolCode}
            urgency={handoff.urgency}
          />
          
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="size-5 text-slate-500" /> Clinical Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div>
                  <div className="text-sm font-medium text-slate-500 mb-1">Origin Facility</div>
                  <div className="font-medium text-slate-900 dark:text-white truncate" title={handoff.originFacilityId}>
                    {handoff.originFacilityId}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-500">Referral Details & Triage</div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 text-sm font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-w-full">
                  <pre>{JSON.stringify(handoff.packetJson, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="size-5 text-slate-400" /> Event Timeline
          </h3>
          
          <Timeline events={events} />
        </div>
      </div>

      {/* Cannot Accept Dialog */}
      <Dialog open={cannotAcceptOpen} onOpenChange={setCannotAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Accept Handoff</DialogTitle>
            <DialogDescription>
              Please provide a reason why this facility cannot accept the patient.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <select 
                className="w-full p-2 rounded-md border border-slate-300 bg-white"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                {CANNOT_ACCEPT_REASONS.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCannotAcceptOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={() => cannotAcceptMutation.mutate()}
              disabled={!reason || cannotAcceptMutation.isPending}
            >
              {cannotAcceptMutation.isPending ? "Submitting..." : "Confirm Cannot Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redirect Dialog */}
      <Dialog open={redirectOpen} onOpenChange={setRedirectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redirect Handoff</DialogTitle>
            <DialogDescription>
              Select a new destination facility to handle this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {handoff.redirectCount >= 3 && (
              <div className="p-3 bg-red-50 text-red-700 rounded flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5" />
                <span className="text-sm">Maximum redirect count (3) reached. You cannot redirect this handoff again.</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Destination *</label>
              <select 
                className="w-full p-2 rounded-md border border-slate-300 bg-white"
                value={redirectTarget}
                onChange={(e) => setRedirectTarget(e.target.value)}
                disabled={handoff.redirectCount >= 3}
              >
                <option value="">Select destination...</option>
                {facilitiesData?.data
                  ?.filter((f: any) => f.id !== handoff.currentDestinationFacilityId && f.tier !== "sub_centre")
                  .map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Redirect *</label>
              <textarea 
                className="w-full p-2 rounded-md border border-slate-300 bg-white min-h-[80px]"
                placeholder="e.g., Required specialist unavailable"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={handoff.redirectCount >= 3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedirectOpen(false)}>Cancel</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white" 
              onClick={() => redirectMutation.mutate()}
              disabled={!redirectTarget || !reason || handoff.redirectCount >= 3 || redirectMutation.isPending}
            >
              {redirectMutation.isPending ? "Redirecting..." : "Confirm Redirect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
