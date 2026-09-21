"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, Clock, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
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
import { StatusBadge as StateBadge } from "~/components/ui/status-badge";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { PatientSummary } from "~/components/orion/patient-summary";
import { ClinicalSummary } from "~/components/orion/clinical-summary";
import { toast } from "sonner";
const CANNOT_ACCEPT_REASONS = [
  "specialist_unavailable",
  "equipment_unavailable",
  "no_appropriate_bed",
  "blood_service_unavailable",
  "wrong_level",
  "operational",
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
      toast.error(`Accept failed: ${err.message}`);
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
      toast.error(`Cannot Accept failed: ${err.message}`);
      refetch();
    }
  });

  const redirectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/redirect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationFacilityId: redirectTarget, reason, clientEventId: crypto.randomUUID() }),
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
      toast.error(`Redirect failed: ${err.message}`);
      refetch();
    }
  });

  const arrivedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/arrived`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["handoff", id] }); }
  });

  const noShowMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/no-show`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["handoff", id] }); }
  });

  const startCareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/start-care`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["handoff", id] }); }
  });

  const [outcomeOpen, setOutcomeOpen] = React.useState(false);
  const [outcomeData, setOutcomeData] = React.useState({ disposition: "", summary: "", adviceSummary: "", followUpDueAt: "" });
  
  const outcomeMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...outcomeData, testsAdvised: [], clientEventId: crypto.randomUUID() };
      if (payload.followUpDueAt) {
        payload.followUpDueAt = new Date(payload.followUpDueAt).toISOString();
      } else {
        delete payload.followUpDueAt;
      }
      const res = await fetch(`/api/v1/handoffs/${id}/outcome`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => {
      setOutcomeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      {/* Header */}
      <div>
        <Link href="/destination" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="size-4 mr-1" /> Back to Inbox
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
          
          {/* Action Area */}
          <div className="flex gap-2">
            {["sent", "acknowledged"].includes(handoff.state) && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => { setReason(""); setCannotAcceptOpen(true); }}
                  disabled={acceptMutation.isPending || cannotAcceptMutation.isPending}
                >
                  Cannot Accept
                </Button>
                <Button 
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || cannotAcceptMutation.isPending}
                >
                  {acceptMutation.isPending ? "Accepting..." : "Accept Patient"}
                </Button>
              </>
            )}

            {handoff.state === "cannot_accept" && (
              <Button 
                onClick={() => { setReason(""); setRedirectTarget(""); setRedirectOpen(true); }}
                disabled={redirectMutation.isPending}
              >
                Redirect to another facility
              </Button>
            )}
            
            {handoff.state === "accepted" && (
              <>
                <Button variant="outline" onClick={() => noShowMutation.mutate()} disabled={noShowMutation.isPending}>
                  Mark No-Show
                </Button>
                <Button onClick={() => arrivedMutation.mutate()} disabled={arrivedMutation.isPending}>
                  Mark Arrived
                </Button>
              </>
            )}

            {handoff.state === "arrived" && (
              <Button onClick={() => startCareMutation.mutate()} disabled={startCareMutation.isPending}>
                Start Care
              </Button>
            )}

            {handoff.state === "in_care" && (
              <Button onClick={() => { setOutcomeData({ disposition: "", summary: "", adviceSummary: "", followUpDueAt: "" }); setOutcomeOpen(true); }}>
                Record Outcome
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 mb-8">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Origin Facility</div>
                <div className="font-medium text-foreground truncate" title={handoff.originFacilityId}>
                  {handoff.originFacilityId}
                </div>
              </div>
            </div>

            <ClinicalSummary packet={handoff.packetJson} protocolCode={handoff.protocolCode} />
          </div>
        </div>

        {/* 3 & 4. Operational Timeline */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" /> Operational Timeline
            </h3>
            
            <Timeline events={events} />
          </div>
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
              <label className="text-sm font-medium text-foreground">Reason *</label>
              <select 
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
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
              className="bg-danger hover:bg-danger/90 text-primary-foreground" 
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
              <div className="p-3 bg-danger/10 text-danger rounded flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5" />
                <span className="text-sm">Maximum redirect count (3) reached. You cannot redirect this handoff again.</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Destination *</label>
              <select 
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
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
              <label className="text-sm font-medium text-foreground">Reason for Redirect *</label>
              <textarea 
                className="w-full p-2 rounded-md border border-input bg-background text-foreground min-h-[80px]"
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
              onClick={() => redirectMutation.mutate()}
              disabled={!redirectTarget || !reason || handoff.redirectCount >= 3 || redirectMutation.isPending}
            >
              {redirectMutation.isPending ? "Redirecting..." : "Confirm Redirect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outcome Dialog */}
      <Dialog open={outcomeOpen} onOpenChange={setOutcomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Outcome</DialogTitle>
            <DialogDescription>
              Record the outcome of the patient's care.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Disposition *</label>
              <select className="w-full p-2 rounded-md border border-input bg-background"
                value={outcomeData.disposition} onChange={e => setOutcomeData({...outcomeData, disposition: e.target.value})}>
                <option value="">Select...</option>
                <option value="treated_returned">Treated & Returned</option>
                <option value="admitted">Admitted</option>
                <option value="referred_on">Referred On</option>
                <option value="deceased">Deceased</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Summary *</label>
              <textarea className="w-full p-2 rounded-md border border-input bg-background"
                value={outcomeData.summary} onChange={e => setOutcomeData({...outcomeData, summary: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Advice Summary</label>
              <textarea className="w-full p-2 rounded-md border border-input bg-background"
                value={outcomeData.adviceSummary} onChange={e => setOutcomeData({...outcomeData, adviceSummary: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Follow-up Due At</label>
              <input type="date" className="w-full p-2 rounded-md border border-input bg-background"
                value={outcomeData.followUpDueAt} onChange={e => setOutcomeData({...outcomeData, followUpDueAt: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeOpen(false)}>Cancel</Button>
            <Button onClick={() => outcomeMutation.mutate()} disabled={!outcomeData.disposition || !outcomeData.summary || outcomeMutation.isPending}>
              {outcomeMutation.isPending ? "Saving..." : "Record Outcome"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
