"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReferralDraft } from "../components/referral-draft-context";
import { Activity, Stethoscope } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function ProtocolSelectionPage() {
  const router = useRouter();
  const { draft, setProtocolCode } = useReferralDraft();

  useEffect(() => {
    if (!draft.patientId) {
      router.replace("/app/new/patient");
    }
  }, [draft.patientId, router]);

  const protocols = [
    {
      code: "anc_danger",
      name: "ANC Danger Signs",
      description: "Triage protocol for antenatal care (maternal) danger signs including bleeding, eclampsia, and reduced fetal movements.",
      icon: <Activity className="size-6 text-foreground" />
    },
    {
      code: "adult_general",
      name: "Adult General Medical",
      description: "General adult medical presentation including acute chest pain, breathlessness, and altered sensorium.",
      icon: <Stethoscope className="size-6 text-foreground" />
    }
  ];

  if (!draft.patientId) return null;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Select Protocol</h1>
        <p className="text-base text-muted-foreground mt-2">Choose the clinical pathway for this referral.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 flex-1">
        {protocols.map((protocol) => {
          const isSelected = draft.protocolCode === protocol.code;
          return (
            <button 
              key={protocol.code} 
              type="button"
              className={`text-left p-6 rounded-xl border transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex flex-col gap-4 shadow-sm ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card'}`}
              onClick={() => setProtocolCode(protocol.code)}
            >
              <div className={`p-3 rounded-md w-fit ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {protocol.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">{protocol.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {protocol.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Actions */}
      <div className="mt-auto pt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/app/new/patient")}>
          Back
        </Button>
        <Button 
          onClick={() => router.push("/app/new/clinical")} 
          disabled={!draft.protocolCode}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

