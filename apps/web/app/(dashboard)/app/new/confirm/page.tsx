"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { FileText, Building2, User, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { ClinicalSummary } from "~/components/orion/clinical-summary";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { db } from "~/lib/offline/db";
import { connectivity } from "~/lib/offline/connectivity";
import { syncEngine } from "~/lib/offline/sync-engine";

interface HandoffCreationResult {
  offline?: boolean;
  data: { id: string; clientMutationId?: string };
}

interface CachedFacility {
  id: string;
  name: string;
  type: string;
}
export default function ConfirmReferralPage() {
  const router = useRouter();
  const { draft, clearDraft } = useReferralDraft();
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [offlineSuccess, setOfflineSuccess] = useState(false);
  const [onlineSuccessId, setOnlineSuccessId] = useState<string | null>(null);

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
      const cacheKey = `patient_${draft.patientId}`;
      try {
        const res = await fetch(`/api/v1/patients/${draft.patientId}`);
        if (res.ok) {
          const json = await res.json();
          if (typeof window !== "undefined") {
            await db.referenceCache.put({ key: cacheKey, data: json, cachedAt: Date.now() });
          }
          return json;
        }
      } catch (e) {
        // network error
      }
      if (typeof window !== "undefined") {
        const cached = await db.referenceCache.get(cacheKey);
        if (cached) return cached.data;
      }
      // Return a fallback so UI doesn't crash completely
      return { ok: true, data: { displayName: "Offline Patient" } };
    },
    enabled: !!draft.patientId
  });

  const { data: facilityData } = useQuery({
    queryKey: ["facilities", draft.destinationFacilityId],
    queryFn: async () => {
      if (!draft.destinationFacilityId) return null;
      const cacheKey = `facility_${draft.destinationFacilityId}`;
      try {
        const res = await fetch(`/api/v1/facilities/${draft.destinationFacilityId}`);
        if (res.ok) {
          const json = await res.json();
          if (typeof window !== "undefined") {
            await db.referenceCache.put({ key: cacheKey, data: json, cachedAt: Date.now() });
          }
          return json;
        }
      } catch (e) {
        // network error
      }
      
      if (typeof window !== "undefined") {
        const cached = await db.referenceCache.get(cacheKey);
        if (cached) return cached.data;
        // fallback to list cache
        const allCached = await db.referenceCache.get("all_facilities");
        if (allCached?.data?.data) {
          const cachedFacilities = allCached.data.data as CachedFacility[];
          const f = cachedFacilities.find((facility: CachedFacility) => facility.id === draft.destinationFacilityId);
          if (f) return { ok: true, data: f };
        }
      }
      return { ok: true, data: { name: "Offline Facility", type: "unknown" } };
    },
    enabled: !!draft.destinationFacilityId
  });

  const [formError, setFormError] = useState<string | null>(null);

  const createHandoff = useMutation({
    mutationFn: async (): Promise<HandoffCreationResult> => {
      const payload = {
        patientId: draft.patientId,
        protocolCode: draft.protocolCode,
        destinationFacilityId: draft.destinationFacilityId,
        packetJson: draft.protocolInputs,
        idempotencyKey,
      };

      if (typeof window !== "undefined") {
        if (connectivity.status === "offline") {
          
          const handoffId = crypto.randomUUID();
          const episodeId = crypto.randomUUID();
          const assessmentId = crypto.randomUUID();
          
          const offlinePayload = {
            ...payload,
            id: handoffId,
            episodeId,
            assessmentId,
          };

          const clientMutationId = await syncEngine.queueHandoffCreation(offlinePayload);
          
          return { 
            offline: true, 
            data: { id: handoffId, clientMutationId } 
          };
        }
      }

      let res;
      try {
        res = await fetch("/api/v1/handoffs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        if (typeof window !== "undefined") {
          const handoffId = crypto.randomUUID();
          const episodeId = crypto.randomUUID();
          const assessmentId = crypto.randomUUID();
          
          const offlinePayload = {
            ...payload,
            id: handoffId,
            episodeId,
            assessmentId,
          };

          const clientMutationId = await syncEngine.queueHandoffCreation(offlinePayload);
          
          return { 
            offline: true, 
            data: { id: handoffId, clientMutationId } 
          };
        }
        throw err;
      }

      if (!res.ok) {
        if (res.status >= 500) {
          if (typeof window !== "undefined") {
            const handoffId = crypto.randomUUID();
            const episodeId = crypto.randomUUID();
            const assessmentId = crypto.randomUUID();
            
            const offlinePayload = {
              ...payload,
              id: handoffId,
              episodeId,
              assessmentId,
            };

            const clientMutationId = await syncEngine.queueHandoffCreation(offlinePayload);
            
            return { 
              offline: true, 
              data: { id: handoffId, clientMutationId } 
            };
          }
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to create handoff");
      }
      return (await res.json()) as HandoffCreationResult;
    },
    onSuccess: (res: HandoffCreationResult) => {
      queryClient.invalidateQueries({ queryKey: ["handoffs"] });
      
      if (res.offline) {
        setOfflineSuccess(true);
      } else {
        setOnlineSuccessId(res.data.id);
      }
    },
    onError: (err: Error) => {
      setFormError(err.message);
    }
  });

  if (offlineSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in zoom-in duration-300 w-full max-w-2xl mx-auto">
        <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Saved Offline</h1>
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          Your referral has been saved locally. It will automatically sync to the server when the connection is restored.
        </p>
        <Button 
          size="lg" 
          className="w-full sm:w-auto min-w-[200px]"
          onClick={() => {
            clearDraft();
            window.location.href = "/app";
          }}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (onlineSuccessId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in zoom-in duration-300 w-full max-w-2xl mx-auto">
        <div className="size-20 bg-success/10 rounded-full flex items-center justify-center mb-6 border border-success/20">
          <CheckCircle2 className="size-10 text-success" />
        </div>
        <h1 className="text-3xl font-semibold mb-3 text-foreground">Referral Dispatched</h1>
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          The referral for <span className="font-semibold text-foreground">{patientData?.data?.displayName || "this patient"}</span> has been successfully sent to <span className="font-semibold text-foreground">{facilityData?.data?.name || "the destination"}</span>.
        </p>
        
        <Button 
          size="lg" 
          className="w-full sm:w-auto min-w-[200px]"
          onClick={() => {
            clearDraft();
            window.location.href = "/app";
          }}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (!draft.destinationFacilityId) return null;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Review & Submit</h1>
        <p className="text-base text-muted-foreground mt-2">Verify all information before creating the handoff.</p>
      </div>

      <div className="flex-1 max-w-3xl">
        {formError && (
          <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
            {formError}
          </div>
        )}
        
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <User className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Patient</div>
                  <div className="font-medium text-lg text-foreground">
                    {patientData?.data?.displayName || "Loading..."}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:border-l sm:pl-6 border-border">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Destination</div>
                  <div className="font-medium text-lg text-foreground">
                    {facilityData?.data?.name || "Loading..."}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="text-sm font-medium text-muted-foreground mb-4">Clinical Payload</div>
              <div className="bg-background rounded-lg border border-border/50 p-3 sm:p-4">
                <ClinicalSummary packet={draft.protocolInputs} protocolCode={draft.protocolCode!} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Action Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 md:static md:bg-transparent md:border-0 md:p-0 md:pt-8 mt-auto z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between w-full pb-safe">
          <Button variant="ghost" onClick={() => router.back()} disabled={createHandoff.isPending}>
            Back
          </Button>
          <Button 
            onClick={() => createHandoff.mutate()}
            disabled={createHandoff.isPending}
            size="lg"
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



