"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReferralDraft } from "../components/referral-draft-context";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Activity, Stethoscope, ArrowRight } from "lucide-react";

import { PageHeader } from "~/components/orion/page-header";

export default function ProtocolSelectionPage() {
  const router = useRouter();
  const { draft, setProtocolCode } = useReferralDraft();

  useEffect(() => {
    if (!draft.patientId) {
      router.replace("/app/new/patient");
    }
  }, [draft.patientId, router]);

  const handleSelect = (code: string) => {
    setProtocolCode(code);
    router.push("/app/new/form");
  };

  const protocols = [
    {
      code: "anc_danger",
      name: "ANC Danger Signs",
      description: "Triage protocol for antenatal care (maternal) danger signs including bleeding, eclampsia, and reduced fetal movements.",
      icon: <Activity className="size-6 text-pink-500" />
    },
    {
      code: "adult_general",
      name: "Adult General Medical",
      description: "General adult medical presentation including acute chest pain, breathlessness, and altered sensorium.",
      icon: <Stethoscope className="size-6 text-blue-500" />
    }
  ];

  if (!draft.patientId) return null;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Select Protocol" 
        description="Step 2 of 4. Choose the clinical pathway for this referral." 
      />

      <div className="grid sm:grid-cols-2 gap-4">
        {protocols.map((protocol) => (
          <Card 
            key={protocol.code} 
            className={`cursor-pointer transition-all hover:border-blue-500 hover:shadow-md group ${draft.protocolCode === protocol.code ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800'}`}
            onClick={() => handleSelect(protocol.code)}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  {protocol.icon}
                </div>
                <ArrowRight className="size-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg">{protocol.name}</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">
                  {protocol.description}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
