"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { ReferralDraftProvider } from "./components/referral-draft-context";
import { cn } from "~/lib/utils";

const STEPS = [
  { id: "patient", path: "/app/new/patient", label: "Patient" },
  { id: "protocol", path: "/app/new/protocol", label: "Protocol" },
  { id: "clinical", path: "/app/new/clinical", label: "Clinical" },
  { id: "destination", path: "/app/new/destination", label: "Destination" },
  { id: "confirm", path: "/app/new/confirm", label: "Confirm" },
];

export default function NewReferralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const currentStepIndex = STEPS.findIndex(s => pathname === s.path);
  
  return (
    <ReferralDraftProvider>
      <div className="max-w-3xl mx-auto w-full py-8 px-4 flex flex-col min-h-[calc(100vh-3.5rem)] pb-24">
        
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-border -z-10" />
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              const isFuture = idx > currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                  <div className={cn(
                    "flex items-center justify-center size-8 rounded-full border-2 text-xs font-medium transition-colors bg-background",
                    isActive ? "border-primary text-primary" : 
                    isCompleted ? "border-ring bg-ring text-primary-foreground" : 
                    "border-border text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="size-4" /> : (idx + 1)}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-foreground" :
                    isCompleted ? "text-foreground" :
                    "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        
      </div>
    </ReferralDraftProvider>
  );
}
