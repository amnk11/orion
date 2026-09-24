"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReferralDraftProvider, useReferralDraft } from "./components/referral-draft-context";
import { cn } from "~/lib/utils";
import { Info } from "lucide-react";
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
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-none">{draft.patientName || "Unknown"}</span>
            <span 
              className="text-xs text-muted-foreground font-mono bg-background border border-border px-1.5 py-0.5 rounded-sm" 
              title={draft.patientId}
            >
              <span className="sm:hidden">{draft.patientId.split('-')[0]}</span>
              <span className="hidden sm:inline">{draft.patientId}</span>
            </span>
          </div>
        </div>
        
        {draft.protocolCode && (
          <div className="hidden sm:flex flex-col items-end sm:items-start border-l border-border pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protocol</span>
            <span className="text-sm font-medium text-foreground mt-0.5 capitalize">
              {draft.protocolCode.replace("_", " ")}
            </span>
          </div>
        )}
        
        {draft.urgency && (
          <div className="flex flex-col items-end sm:border-l border-border sm:pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Urgency</span>
            <div className="mt-0.5">
              <UrgencyBadge level={draft.urgency} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WizardStepperVertical() {
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex(s => pathname === s.path);

  return (
    <div className="hidden md:block w-[220px] lg:w-[240px] shrink-0 relative pt-10">
      <nav aria-label="Progress" className="sticky top-[100px]">
        <ol className="flex flex-col relative">
        <div className="absolute left-[11px] top-3 bottom-8 w-[1.5px] bg-border/60 -z-10" aria-hidden="true" />
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          
          return (
            <li key={step.id} className="relative pb-9 last:pb-0">
              <div className="flex items-start gap-4">
                {isCompleted ? (
                  <Link 
                    href={step.path}
                    className="flex shrink-0 items-center justify-center size-[24px] rounded-full text-[11px] font-bold transition-all bg-primary/10 text-primary hover:bg-primary/20 ring-4 ring-background z-10"
                  >
                    ✓
                  </Link>
                ) : (
                  <div 
                    className={cn(
                      "flex shrink-0 items-center justify-center size-[24px] rounded-full text-[11px] font-bold transition-all ring-4 ring-background z-10",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-background border-2 border-border/80 text-muted-foreground/70"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {idx + 1}
                  </div>
                )}
                <div className="flex flex-col pt-0.5">
                  <span className={cn(
                    "text-sm font-semibold tracking-wider uppercase",
                    isActive ? "text-primary" : isCompleted ? "text-foreground/90" : "text-muted-foreground/70"
                  )}>
                    {step.label}
                  </span>
                  <span className={cn("text-sm mt-0.5 leading-snug", isActive ? "text-muted-foreground" : isCompleted ? "text-muted-foreground/80" : "text-muted-foreground/60")}>
                    {step.label === "Patient" ? "Patient information" :
                     step.label === "Protocol" ? "Clinical protocol" :
                     step.label === "Clinical" ? "Clinical assessment" :
                     step.label === "Destination" ? "Referral facility" :
                     "Review & submit"}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      
      <div className="mt-8 p-4 bg-primary/5 rounded-[8px] border border-primary/20 flex items-start gap-3 text-primary/90">
        <Info className="size-[18px] shrink-0 mt-0.5 text-primary" />
        <p className="text-sm leading-relaxed font-medium">
          Complete each step in order. This referral is not dispatched until you submit it.
        </p>
      </div>
    </nav>
    </div>
  );
}

function WizardStepperMobile() {
  const pathname = usePathname();
  const currentStepIndex = STEPS.findIndex(s => pathname === s.path);
  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="md:hidden flex items-center gap-2 mb-6 bg-muted/30 p-3 rounded-lg border border-border/40">
      <span className="text-sm font-semibold text-foreground">
        Step {currentStepIndex + 1} of {STEPS.length}
      </span>
      <span className="text-sm text-muted-foreground">&middot;</span>
      <span className="text-sm text-muted-foreground font-medium">{currentStep?.label}</span>
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
        <div className="max-w-[1100px] mx-auto w-full pt-8 pb-32 px-4 md:px-8 md:pb-12 flex flex-col md:flex-row gap-12 lg:gap-16 flex-1">
          {/* Main content, gets most width */}
          <div className="flex-1 flex flex-col relative min-w-0 w-full max-w-[840px]">
            <WizardStepperMobile />
            {children}
          </div>
          
          {/* Right Rail, fixed width, sticky on desktop */}
          <WizardStepperVertical />
        </div>
      </div>
    </ReferralDraftProvider>
  );
}
