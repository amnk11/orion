"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReferralDraftProvider, useReferralDraft } from "./components/referral-draft-context";
import { cn } from "~/lib/utils";
import { UrgencyBadge } from "~/components/ui/urgency-badge";

const STEPS = [
  { id: "patient", path: "/app/new/patient", label: "Patient" },
  { id: "protocol", path: "/app/new/protocol", label: "Protocol" },
  { id: "clinical", path: "/app/new/clinical", label: "Clinical" },
  { id: "destination", path: "/app/new/destination", label: "Destination" },
  { id: "confirm", path: "/app/new/confirm", label: "Confirm" },
];

function WizardContextHeader() {
  const { draft } = useReferralDraft();
  
  if (!draft.patientId) return null;

  return (
    <div className="bg-surface-inset border-b border-border sticky top-0 z-40">
      <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Patient</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-semibold text-foreground">{draft.patientName || "Unknown"}</span>
            <span className="text-xs text-muted-foreground font-mono bg-background border border-border px-1.5 py-0.5 rounded-sm">
              {draft.patientId}
            </span>
          </div>
        </div>
        
        {draft.protocolCode && (
          <div className="hidden sm:flex flex-col items-end sm:items-start border-l border-border pl-4">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Protocol</span>
            <span className="text-sm font-medium text-foreground mt-0.5 capitalize">
              {draft.protocolCode.replace("_", " ")}
            </span>
          </div>
        )}
        
        {draft.urgency && (
          <div className="flex flex-col items-end sm:border-l border-border sm:pl-4">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Urgency</span>
            <div className="mt-0.5">
              <UrgencyBadge level={draft.urgency} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WizardStepper() {
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex(s => pathname === s.path);
  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="mb-8">
      {/* Mobile Stepper: Step X of Y */}
      <div className="sm:hidden flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          Step {currentStepIndex + 1} of {STEPS.length}
        </span>
        <span className="text-sm text-muted-foreground">&middot;</span>
        <span className="text-sm text-muted-foreground">{currentStep?.label}</span>
      </div>

      {/* Desktop Stepper */}
      <nav aria-label="Progress" className="hidden sm:block relative">
        <ol className="flex items-start justify-between relative">
          <div className="absolute left-0 top-4 -translate-y-1/2 w-full h-px bg-border -z-10" aria-hidden="true" />
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            
            return (
              <li key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 z-10 w-24">
                {isCompleted ? (
                  <Link 
                    href={step.path}
                    className={cn(
                      "flex items-center justify-center size-8 rounded-full border-2 text-xs font-semibold transition-colors bg-background z-10",
                      "border-primary bg-primary text-primary-foreground hover:bg-primary-hover"
                    )}
                  >
                    ✓
                  </Link>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center justify-center size-8 rounded-full border-2 text-xs font-semibold transition-colors bg-background z-10",
                      isActive ? "border-primary text-primary" : "border-border text-muted-foreground"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {idx + 1}
                  </div>
                )}
                <span className={cn(
                  "text-xs font-semibold text-center leading-tight",
                  isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

export default function NewReferralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReferralDraftProvider>
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] relative">
        <WizardContextHeader />
        
        {/* Main Content Area */}
        {/* pb-24 ensures scrollable content doesn't get hidden behind the mobile fixed action bar */}
        <div className="max-w-3xl mx-auto w-full py-8 px-4 flex flex-col flex-1 pb-32 md:pb-12">
          <WizardStepper />
          
          <div className="flex-1 flex flex-col relative">
            {children}
          </div>
        </div>
      </div>
    </ReferralDraftProvider>
  );
}
