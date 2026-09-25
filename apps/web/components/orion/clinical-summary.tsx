import React from "react";
import { AlertCircle } from "lucide-react";
import { ClinicalDictionary } from "~/lib/clinical-dictionary";

interface ClinicalSummaryProps {
  packet: any;
  protocolCode?: string;
}

export function ClinicalSummary({ packet, protocolCode }: ClinicalSummaryProps) {
  if (!packet) {
    return <div className="text-sm text-muted-foreground p-4 bg-surface-inset border border-border rounded-md">No clinical data recorded.</div>;
  }

  // Handle both nested {triage: ...} (from older mocks) and flat {bp: ...} (actual payload)
  const triage = packet.triage ? packet.triage : packet;

  // Categorize fields based on the dictionary
  const vitals: { key: string; value: any; dict: any }[] = [];
  const symptoms: { key: string; value: any; dict: any }[] = [];
  const additional: { key: string; value: any; dict: any }[] = [];
  
  // dangerSigns are usually array from evaluateProtocol
  const dangerSigns = Array.isArray(triage.dangerSigns) ? triage.dangerSigns : [];

  Object.entries(triage).forEach(([key, value]) => {
    if (key === "dangerSigns" || key === "urgency") return; // Handled separately
    
    // Skip empty or false booleans for symptoms/critical if we want a denser UI
    if (typeof value === "boolean" && !value) return; 
    if (value === null || value === undefined || value === "") return;

    const dict = ClinicalDictionary.fields[key];
    
    if (dict?.category === "vitals") {
      vitals.push({ key, value, dict });
    } else if (dict?.category === "symptoms" || dict?.category === "critical") {
      symptoms.push({ key, value, dict });
    } else {
      additional.push({ key, value, dict: dict || { label: key, category: "additional" } });
    }
  });

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Danger Signs */}
      {dangerSigns.length > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-md p-4">
          <h3 className="text-sm font-semibold text-danger mb-3 flex items-center gap-2">
            <AlertCircle className="size-4" />
            Critical Findings
          </h3>
          <ul className="space-y-1.5">
            {dangerSigns.map((sign: string, idx: number) => (
              <li key={idx} className="text-sm font-medium text-foreground flex items-start gap-2">
                <span className="text-danger mt-0.5">•</span>
                {sign}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Vital Signs Grid */}
      {vitals.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 border-b border-border pb-2">Vital Signs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {vitals.map(({ key, value, dict }) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-0.5">{dict.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-foreground">{String(value)}</span>
                  {dict.unit && <span className="text-xs text-muted-foreground">{dict.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Symptoms */}
      {symptoms.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 border-b border-border pb-2">Symptoms & Findings</h3>
          <div className="grid gap-y-2 text-sm">
            {symptoms.map(({ key, value, dict }) => (
              <div key={key} className="flex justify-between items-start py-1.5 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{dict.label}</span>
                <span className="font-medium text-foreground text-right ml-4">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Additional Information */}
      {additional.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 border-b border-border pb-2">Additional Information</h3>
          <div className="grid gap-y-2 text-sm">
            {additional.map(({ key, value, dict }) => (
              <div key={key} className="flex justify-between items-start py-1.5 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground capitalize">
                  {dict.label === key ? key.replace(/([A-Z])/g, " $1").trim() : dict.label}
                </span>
                <span className="font-medium text-foreground text-right ml-4">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
