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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Select Protocol</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose the clinical pathway for this referral.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 flex-1">
        {protocols.map((protocol) => {
          const isSelected = draft.protocolCode === protocol.code;
          return (
            <button 
              key={protocol.code} 
              type="button"
              className={`text-left p-6 rounded-lg border transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex flex-col gap-4 ${isSelected ? 'border-ring bg-accent dark:bg-accent/20 ring-1 ring-ring' : 'border-border'}`}
              onClick={() => setProtocolCode(protocol.code)}
            >
              <div className={`p-3 rounded-md w-fit ${isSelected ? 'bg-background' : 'bg-muted'}`}>
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
      
      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 md:static md:bg-transparent md:border-none md:p-0 md:mt-12 md:pt-6 md:border-t">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <Button variant="ghost" onClick={() => router.push("/app/new/patient")}>
            Back
          </Button>
          <Button 
            onClick={() => router.push("/app/new/clinical")} 
            disabled={!draft.protocolCode}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
