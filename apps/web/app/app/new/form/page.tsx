"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { evaluateProtocol, ANC_DANGER_PROTOCOL, ADULT_GENERAL_PROTOCOL, ProtocolDefinition } from "@orion/protocols";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { PageHeader } from "~/components/orion/page-header";
import { UrgencyBadge } from "~/components/orion/urgency-badge";

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
    <div className="space-y-6">
      <PageHeader 
        title="Clinical Details" 
        description={`Step 3 of 4. ${protocol.name}`} 
      />

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Triage Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {protocol.fields.map((field: any) => {
                if (field.type === "boolean") {
                  return (
                    <div key={field.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                      <Label htmlFor={field.id} className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
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
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id={field.id}
                        type="number"
                        className="max-w-xs"
                        value={(formData[field.id] as number) || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </div>
                  );
                }

                if (field.type === "text") {
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id={field.id}
                        type="text"
                        value={(formData[field.id] as string) || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                    </div>
                  );
                }

                return null;
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 sticky top-6">
          <Card className={`shadow-sm border-2 ${triageResult?.urgency === 'red' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20' : triageResult?.urgency === 'orange' ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'}`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Triage</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {triageResult?.urgency && <UrgencyBadge level={triageResult.urgency} className="text-lg px-3 py-1" />}
              </div>
            </CardHeader>
            <CardContent>
              {triageResult?.can_submit ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="size-4" /> Ready to submit
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                    <AlertCircle className="size-4" /> Missing required info
                  </div>
                  <ul className="text-sm text-red-600/80 dark:text-red-400/80 space-y-1 list-disc pl-4">
                    {triageResult?.completeness.missing.map((m: any, i: number) => (
                      <li key={i}>{m.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleNext} 
                disabled={!triageResult?.can_submit}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Proceed to Destination
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
