"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { FileText, Building2, User, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { UrgencyBadge } from "~/components/ui/urgency-badge";

export default function ConfirmReferralPage() {
  const router = useRouter();
  const { draft, clearDraft } = useReferralDraft();
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!draft.destinationFacilityId) {
      router.replace("/app/new/destination");
    }
  }, [draft.destinationFacilityId, router]);

  // Fetch names for display
  const { data: patientData } = useQuery({
    queryKey: ["patients", draft.patientId],
    queryFn: async () => {
      if (!draft.patientId) return null;
      const res = await fetch(`/api/v1/patients/${draft.patientId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!draft.patientId
  });

  const { data: facilityData } = useQuery({
    queryKey: ["facilities", draft.destinationFacilityId],
    queryFn: async () => {
      if (!draft.destinationFacilityId) return null;
      const res = await fetch(`/api/v1/facilities/${draft.destinationFacilityId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!draft.destinationFacilityId
  });

  const createHandoff = useMutation({
    mutationFn: async () => {
      const payload = {
        patientId: draft.patientId,
        protocolCode: draft.protocolCode,
        destinationFacilityId: draft.destinationFacilityId,
        packetJson: draft.protocolInputs,
        idempotencyKey,
      };

      const res = await fetch("/api/v1/handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create handoff");
      }
      return res.json();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["handoffs"] });
      clearDraft();
      router.push(`/app/handoff/${res.data.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  if (!draft.destinationFacilityId) return null;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Review Handoff</h1>
        <p className="text-sm text-muted-foreground mt-1">Confirm the details before dispatching to the destination.</p>
      </div>

      <div className="flex-1 max-w-2xl">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="bg-muted/30 p-6 border-b border-border flex justify-between items-start">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Calculated Urgency</div>
              <div className="flex items-center gap-2 mt-1">
                {draft.urgency && <UrgencyBadge level={draft.urgency} />}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground mb-1">Protocol</div>
              <div className="font-medium text-foreground">
                {draft.protocolCode === "anc_danger" ? "ANC Danger Signs" : "Adult General"}
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            <div className="p-6 flex items-start gap-4">
              <div className="p-2 bg-accent text-accent-foreground rounded-full">
                <User className="size-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Patient</div>
                <div className="font-medium text-lg mt-1 text-foreground">
                  {patientData?.data?.displayName || "Loading..."}
                </div>
              </div>
            </div>

            <div className="p-6 flex items-start gap-4">
              <div className="p-2 bg-accent text-accent-foreground rounded-full">
                <Building2 className="size-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Destination Facility</div>
                <div className="font-medium text-lg mt-1 text-foreground">
                  {facilityData?.data?.name || "Loading..."}
                </div>
              </div>
            </div>

            <div className="p-6 flex items-start gap-4">
              <div className="p-2 bg-accent text-accent-foreground rounded-full">
                <FileText className="size-5" />
              </div>
              <div className="w-full min-w-0">
                <div className="text-sm font-medium text-muted-foreground mb-3">Clinical Payload</div>
                <div className="bg-muted rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(draft.protocolInputs, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 md:static md:bg-transparent md:border-none md:p-0 md:mt-12 md:pt-6 md:border-t">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <Button variant="ghost" onClick={() => router.back()} disabled={createHandoff.isPending}>
            Back
          </Button>
          <Button 
            onClick={() => createHandoff.mutate()}
            disabled={createHandoff.isPending}
          >
            {createHandoff.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="size-4 mr-2" />
            )}
            Dispatch Handoff
          </Button>
        </div>
      </div>
    </div>
  );
}
