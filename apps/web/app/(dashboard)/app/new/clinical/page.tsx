"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { evaluateProtocol, ANC_DANGER_PROTOCOL, ADULT_GENERAL_PROTOCOL, ProtocolDefinition } from "@orion/protocols";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { UrgencyBadge } from "~/components/ui/urgency-badge";

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

  const [formData, setFormData] = useState<Record<string, unknown>>(draft.protocolInputs || {});

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
      setProtocolInputs(formData, triageResult.urgency, true);
      router.push("/app/new/destination");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clinical Details</h1>
          <p className="text-sm text-muted-foreground mt-1">{protocol.name}</p>
        </div>
        
        {/* Live Triage Urgency */}
        {triageResult?.urgency && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Calculated Urgency</span>
            <UrgencyBadge level={triageResult.urgency} />
          </div>
        )}
      </div>

      <div className="flex-1 max-w-2xl">
        <div className="space-y-8">
          {protocol.fields.map((field: any) => {
            if (field.type === "boolean") {
              return (
                <div key={field.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <Label htmlFor={field.id} className="font-medium text-foreground cursor-pointer text-base">
                    {field.label} {field.required && <span className="text-danger">*</span>}
                  </Label>
                  <Switch
                    id={field.id}
                    checked={Boolean(formData[field.id])}
                    onCheckedChange={(val) => handleInputChange(field.id, val)}
                  />
                </div>
              );
            }

            if (field.type === "number") {
              return (
                <div key={field.id} className="space-y-2 py-2">
                  <Label htmlFor={field.id} className="text-foreground">
                    {field.label} {field.required && <span className="text-danger">*</span>}
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
                    {field.label} {field.required && <span className="text-danger">*</span>}
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
          })}
        </div>
      </div>
      
      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 md:static md:bg-transparent md:border-none md:p-0 md:mt-12 md:pt-6 md:border-t">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
          {!triageResult?.can_submit && (triageResult?.completeness?.missing?.length ?? 0) > 0 && (
            <div className="flex items-start gap-2 text-sm text-danger bg-danger/5 p-3 rounded-md">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Missing required info:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  {triageResult?.completeness?.missing?.map((m: any, i: number) => (
                    <li key={i}>{m.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => router.push("/app/new/protocol")}>
              Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!triageResult?.can_submit}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
