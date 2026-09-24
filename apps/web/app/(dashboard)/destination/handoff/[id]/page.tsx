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
import { StateGuidancePanel } from "~/components/orion/state-guidance";
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
  const [formError, setFormError] = React.useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<{ kind: "success" | "error"; message: string } | null>(null);

  /**
   * Every clinical transition reports its outcome in the main interface, not only
   * in a transient toast: what changed, whether the record is safe, and what to do
   * next if it failed.
   */
  const reportResult = (kind: "success" | "error", message: string) => {
    setActionFeedback({ kind, message });
    if (kind === "success") toast.success(message);
    else toast.error(message);
  };

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
    enabled: true,
  });

  const handoff = detailData?.data?.handoff;
  const events = detailData?.data?.events || [];
  const facilityNames = Object.fromEntries((facilitiesData?.data || []).map((facility: { id: string; name: string }) => [facility.id, facility.name]));

  // Mutations
  const ackMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      queryClient.invalidateQueries({ queryKey: ["handoffs", "inbound"] });
      reportResult("success", "Receipt acknowledged. Next: accept this patient or record why you cannot accept.");
    },
    onError: () => reportResult("error", "Receipt was not acknowledged. The referral is unchanged and still needs acknowledgement — retry when connected."),
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
      reportResult("success", "Patient accepted. Your facility now owns this referral — mark arrival when the patient reaches you.");
    },
    onError: (err: Error) => {
      reportResult("error", `Not accepted: ${err.message}. The referral is unchanged and still awaiting your decision.`);
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
      reportResult("success", "Recorded as unable to accept. Next: redirect this patient to a facility that can take them.");
    },
    onError: (err: Error) => {
      reportResult("error", `Not recorded: ${err.message}. No decision was saved and the referral is still awaiting your decision.`);
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
      reportResult("success", "Referral redirected. The new destination must acknowledge receipt.");
      // Go back to inbox since we don't own this handoff anymore
      router.push("/destination");
    },
    onError: (err: Error) => {
      reportResult("error", `Not redirected: ${err.message}. The patient still has no accepting facility — retry or choose another destination.`);
      refetch();
    }
  });

  const arrivedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/arrived`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("The server rejected the arrival update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      reportResult("success", "Arrival recorded. Next: start care for this patient.");
    },
    onError: (err: Error) => {
      reportResult("error", `Arrival not recorded: ${err.message}. The referral is unchanged — the patient is still shown as accepted but not arrived.`);
      refetch();
    },
  });

  const noShowMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/no-show`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("The server rejected the no-show update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      reportResult("success", "Recorded as no-show. The referring facility must now decide whether to re-refer.");
    },
    onError: (err: Error) => {
      reportResult("error", `No-show not recorded: ${err.message}. The referral is unchanged — the patient is still shown as accepted.`);
      refetch();
    },
  });

  const startCareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/handoffs/${id}/start-care`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEventId: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error("The server rejected the start-of-care update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      reportResult("success", "Care started. Next: record the outcome when care is complete.");
    },
    onError: (err: Error) => {
      reportResult("error", `Care not started: ${err.message}. The referral is unchanged — the patient is still shown as arrived.`);
      refetch();
    },
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
      if (!res.ok) throw new Error("The server rejected the outcome");
      return res.json();
    },
    onSuccess: () => {
      setOutcomeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["handoff", id] });
      reportResult("success", "Outcome recorded. The referring facility will close the episode and arrange follow-up.");
    },
    onError: (err: Error) => {
      reportResult("error", `Outcome not recorded: ${err.message}. Care is still open — nothing was lost, retry or correct the details.`);
      refetch();
    }
  });

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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 h-full flex flex-col">
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
          <div className="flex flex-wrap gap-2">
            {handoff.state === "sent" && (
              <Button onClick={() => ackMutation.mutate()} disabled={ackMutation.isPending}>
                {ackMutation.isPending ? "Acknowledging…" : "Acknowledge receipt"}
              </Button>
            )}
            {handoff.state === "acknowledged" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => { setFormError(null); setReason(""); setCannotAcceptOpen(true); }}
                  disabled={acceptMutation.isPending || cannotAcceptMutation.isPending}
                >
                  Cannot accept
                </Button>
                <Button 
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending || cannotAcceptMutation.isPending}
                >
                  {acceptMutation.isPending ? "Accepting..." : "Accept patient"}
                </Button>
              </>
            )}

            {handoff.state === "cannot_accept" && (
              <Button 
                onClick={() => { setFormError(null); setReason(""); setRedirectTarget(""); setRedirectOpen(true); }}
                disabled={redirectMutation.isPending}
              >
                Redirect to another facility
              </Button>
            )}
            
            {handoff.state === "accepted" && (
              <>
                <Button variant="outline" onClick={() => noShowMutation.mutate()} disabled={noShowMutation.isPending}>
                  Mark no-show
                </Button>
                <Button onClick={() => arrivedMutation.mutate()} disabled={arrivedMutation.isPending}>
                  {arrivedMutation.isPending ? "Recording arrival..." : "Mark arrived"}
                </Button>
              </>
            )}

            {handoff.state === "arrived" && (
              <Button onClick={() => startCareMutation.mutate()} disabled={startCareMutation.isPending}>
                {startCareMutation.isPending ? "Starting care..." : "Start care"}
              </Button>
            )}

            {handoff.state === "in_care" && (
              <Button onClick={() => { setOutcomeData({ disposition: "", summary: "", adviceSummary: "", followUpDueAt: "" }); setOutcomeOpen(true); }}>
                Record outcome
              </Button>
            )}
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div
          role={actionFeedback.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            actionFeedback.kind === "error"
              ? "rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
              : "rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success"
          }
        >
          {actionFeedback.message}
        </div>
      )}

      <StateGuidancePanel state={handoff.state} role="destination" />

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
                <div className="font-medium text-foreground">
                  {facilityNames[handoff.originFacilityId] || "Origin facility name unavailable"}
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
            
            <Timeline events={events} facilityNames={facilityNames} />
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
            <p id="cannot-accept-help" className="text-sm text-muted-foreground">
              Recording this tells the referring facility you cannot take the patient. The referral then has to be
              redirected to another facility, so the reason must be specific enough for them to act on.
            </p>
            <div className="space-y-2">
              <label htmlFor="cannot-accept-reason" className="text-sm font-medium text-foreground">Reason <span aria-hidden="true">*</span></label>
              <select 
                id="cannot-accept-reason"
                className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setFormError(null); }}
                required
                aria-required="true"
                aria-describedby="cannot-accept-help"
                aria-invalid={formError ? true : undefined}
              >
                <option value="">Select a reason...</option>
                {CANNOT_ACCEPT_REASONS.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            {formError && (
              <p role="alert" className="text-sm font-medium text-danger">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCannotAcceptOpen(false)} disabled={cannotAcceptMutation.isPending}>
              Keep as pending decision
            </Button>
            <Button 
              className="bg-danger hover:bg-danger/90 text-primary-foreground" 
              onClick={() => {
                if (!reason) {
                  setFormError("Select a reason before confirming — the referring facility needs it to arrange a new destination.");
                  return;
                }
                setFormError(null);
                cannotAcceptMutation.mutate();
              }}
              disabled={cannotAcceptMutation.isPending}
            >
              {cannotAcceptMutation.isPending ? "Submitting..." : "Confirm unable to accept"}
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
              <label htmlFor="redirect-destination" className="text-sm font-medium text-foreground">New destination <span aria-hidden="true">*</span></label>
              <select 
                id="redirect-destination"
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
              <label htmlFor="redirect-reason" className="text-sm font-medium text-foreground">Reason for redirect <span aria-hidden="true">*</span></label>
              <textarea 
                id="redirect-reason"
                className="w-full p-2 rounded-md border border-input bg-background text-foreground min-h-[80px]"
                placeholder="e.g., Required specialist unavailable"
                required
                aria-required="true"
                aria-invalid={formError ? true : undefined}
                value={reason}
                onChange={(e) => { setReason(e.target.value); setFormError(null); }}
                disabled={handoff.redirectCount >= 3}
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm font-medium text-danger">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedirectOpen(false)} disabled={redirectMutation.isPending}>
              Keep as pending decision
            </Button>
            <Button 
              onClick={() => {
                if (!redirectTarget || !reason) {
                  setFormError("Select a destination facility and record a reason — the origin facility and the patient need both.");
                  return;
                }
                setFormError(null);
                redirectMutation.mutate();
              }}
              disabled={handoff.redirectCount >= 3 || redirectMutation.isPending}
            >
              {redirectMutation.isPending ? "Redirecting..." : "Confirm redirect"}
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
              <label htmlFor="outcome-disposition" className="text-sm font-medium text-foreground">Disposition <span aria-hidden="true">*</span></label>
              <select id="outcome-disposition" className="w-full p-2 rounded-md border border-input bg-background"
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
              <label htmlFor="outcome-summary" className="text-sm font-medium text-foreground">Summary <span aria-hidden="true">*</span></label>
              <textarea id="outcome-summary" className="w-full p-2 rounded-md border border-input bg-background"
                value={outcomeData.summary} onChange={e => setOutcomeData({...outcomeData, summary: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label htmlFor="outcome-advice" className="text-sm font-medium text-foreground">Advice summary</label>
              <textarea id="outcome-advice" className="w-full p-2 rounded-md border border-input bg-background"
                value={outcomeData.adviceSummary} onChange={e => setOutcomeData({...outcomeData, adviceSummary: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label htmlFor="outcome-follow-up" className="text-sm font-medium text-foreground">Follow-up due date</label>
              <input id="outcome-follow-up" type="date" className="w-full p-2 rounded-md border border-input bg-background"
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

