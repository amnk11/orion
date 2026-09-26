import { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "standard" | "wide";
}

/**
 * Standardized page wrapper that enforces consistent padding,
 * max-width, and section spacing across the application.
 *
 * BUG-09 FIX: Renders a <div> instead of <main>. The outer dashboard layout
 * already provides the <main> landmark — nesting a second <main> is invalid
 * HTML and breaks screen reader navigation.
 */
export function PageShell({ children, className, maxWidth = "standard" }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full p-4 md:p-8 space-y-8",
        maxWidth === "standard" ? "max-w-5xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}
