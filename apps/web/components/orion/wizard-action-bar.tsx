import { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface WizardActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standardized fixed action bar for wizard steps (especially mobile).
 * Anchors to the bottom on mobile, inline on desktop.
 */
export function WizardActionBar({ children, className }: WizardActionBarProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 z-[40] pb-safe",
      "md:static md:bg-transparent md:border-0 md:p-0 md:pt-8 md:mt-auto",
      className
    )}>
      <div className="max-w-5xl mx-auto flex items-center justify-end gap-3 w-full">
        {children}
      </div>
    </div>
  );
}
