"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { evaluateProtocol, ANC_DANGER_PROTOCOL, ADULT_GENERAL_PROTOCOL, ProtocolDefinition, ProtocolField } from "@orion/protocols";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { AlertCircle, Loader2 } from "lucide-react";
import { UrgencyBadge } from "~/components/ui/urgency-badge";
import { ClinicalDictionary } from "~/lib/clinical-dictionary";

export default function ProtocolFormPage() {
  const router = useRouter();
  const { draft, setProtocolInputs } = useReferralDraft();

  useEffect(() => {
    if (!draft.protocolCode) {
      router.replace("/app/new/protocol");
    }
  }, [draft.protocolCode, router]);

  const protocol: ProtocolDefinition | undefined = useMemo(() => {
    if (draft.protocolCode === "anc_danger") return ANC_DANGER_PROTOCOL;
    if (draft.protocolCode === "adult_general") return ADULT_GENERAL_PROTOCOL;
    return undefined;
  }, [draft.protocolCode]);

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial = { ...draft.protocolInputs };
    if (draft.patientAge !== null && draft.patientAge !== undefined && initial["age"] === undefined) {
      initial["age"] = draft.patientAge;
    }
    return initial;
  });
  
  const [isNavigating, setIsNavigating] = useState(false);

  const triageResult = useMemo(() => {
    if (!protocol) return null;
    return evaluateProtocol(protocol, formData);
  }, [protocol, formData]);

  if (!protocol) return null;

  const handleInputChange = (id: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    if (triageResult?.can_submit) {
      setIsNavigating(true);
      setProtocolInputs(formData, triageResult.urgency, true);
      router.push("/app/new/destination");
    }
  };

  const getFieldCategory = (fieldId: string) => {
    return ClinicalDictionary.fields[fieldId]?.category || "additional";
  };

  const getFieldLabel = (fieldId: string, fallback: string) => {
    const dict = ClinicalDictionary.fields[fieldId];
    return dict ? (dict.unit ? `${dict.label} (${dict.unit})` : dict.label) : fallback;
  };

  const vitals = protocol.fields.filter((field: ProtocolField) => getFieldCategory(field.id) === "vitals");
  const critical = protocol.fields.filter((field: ProtocolField) => getFieldCategory(field.id) === "critical");
  const symptoms = protocol.fields.filter((field: ProtocolField) => getFieldCategory(field.id) === "symptoms");
  const additional = protocol.fields.filter((field: ProtocolField) => !["vitals", "critical", "symptoms"].includes(getFieldCategory(field.id)));

  const renderField = (field: ProtocolField) => {
    const label = getFieldLabel(field.id, field.label);
    if (field.type === "boolean") {
      return (
        <div key={field.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
          <Label htmlFor={field.id} className="font-medium text-foreground cursor-pointer text-base">
            {label} {field.required && <span className="text-danger">*</span>}
          </Label>
          <Switch
            id={field.id}
            checked={Boolean(formData[field.id])}
            onCheckedChange={(val: boolean) => handleInputChange(field.id, val)}
          />
        </div>
      );
    }
    if (field.type === "number") {
      return (
        <div key={field.id} className="space-y-2 py-2">
          <Label htmlFor={field.id} className="text-foreground">
            {label} {field.required && <span className="text-danger">*</span>}
          </Label>
          <Input
            id={field.id}
            type="number"
            className="max-w-[200px]"
            value={(formData[field.id] as number) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>
      );
    }
    if (field.type === "text") {
      return (
        <div key={field.id} className="space-y-2 py-2">
          <Label htmlFor={field.id} className="text-foreground">
            {label} {field.required && <span className="text-danger">*</span>}
          </Label>
          <Input
            id={field.id}
            type="text"
            className="max-w-md"
            value={(formData[field.id] as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col flex-1 h-full relative">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Clinical Details</h1>
          <p className="text-base text-muted-foreground mt-2">{protocol.name}</p>
        </div>
        
        {/* Live Triage Urgency */}
        {triageResult?.urgency && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calculated Urgency</span>
            <UrgencyBadge level={triageResult.urgency} />
          </div>
        )}
      </div>

      <div className="flex-1 max-w-2xl pb-8">
        
        {critical.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Danger Signs & Critical Findings</h2>
            <div className="space-y-1">
              {critical.map(renderField)}
            </div>
          </div>
        )}

        {vitals.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Vital Signs</h2>
            <div className="space-y-1">
              {vitals.map(renderField)}
            </div>
          </div>
        )}

        {symptoms.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Symptoms</h2>
            <div className="space-y-1">
              {symptoms.map(renderField)}
            </div>
          </div>
        )}

        {additional.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">Additional Information</h2>
            <div className="space-y-1">
              {additional.map(renderField)}
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Action Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 md:static md:bg-transparent md:border-0 md:p-0 md:pt-8 mt-auto z-50">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {!triageResult?.can_submit && (triageResult?.completeness?.missing?.length ?? 0) > 0 && (
            <div className="flex items-start gap-2 text-sm text-danger bg-danger/5 p-3 rounded-md border border-danger/10">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">Missing required info:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {Array.from(new Set(triageResult?.completeness?.missing?.map((missing) => missing.message) || [])).map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between w-full pb-safe">
            <Button variant="ghost" onClick={() => router.push("/app/new/protocol")} disabled={isNavigating}>
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!triageResult?.can_submit || isNavigating}
              size="lg"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Continuing...
                </>
              ) : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

