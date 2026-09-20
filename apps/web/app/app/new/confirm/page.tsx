"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FileText, Building2, User, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { UrgencyBadge } from "~/components/orion/urgency-badge";
import { PageHeader } from "~/components/orion/page-header";

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
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader 
        title="Review Handoff" 
        description="Confirm the details before dispatching to the destination."
      />

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-slate-500 mb-1">Calculated Urgency</div>
            <div className="flex items-center gap-2 mt-1">
              {draft.urgency && <UrgencyBadge level={draft.urgency} className="text-lg px-3 py-1" />}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-500 mb-1">Protocol</div>
            <div className="font-medium text-slate-900 dark:text-white">
              {draft.protocolCode === "anc_danger" ? "ANC Danger Signs" : "Adult General"}
            </div>
          </div>
        </div>

        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="p-6 flex items-start gap-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <User className="size-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Patient</div>
              <div className="font-medium text-lg mt-1 text-slate-900 dark:text-white">
                {patientData?.data?.displayName || "Loading..."}
              </div>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
              <Building2 className="size-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Destination Facility</div>
              <div className="font-medium text-lg mt-1 text-slate-900 dark:text-white">
                {facilityData?.data?.name || "Loading..."}
              </div>
            </div>
          </div>

          <div className="p-6 flex items-start gap-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              <FileText className="size-5 text-slate-600" />
            </div>
            <div className="w-full">
              <div className="text-sm font-medium text-slate-500 mb-3">Clinical Payload</div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 text-sm font-mono text-slate-600 dark:text-slate-400">
                <pre>{JSON.stringify(draft.protocolInputs, null, 2)}</pre>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={createHandoff.isPending}>
            Back
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
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
        </CardFooter>
      </Card>
    </div>
  );
}
