import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "~/lib/utils";

interface BackLinkProps {
  href: string;
  label?: string;
  className?: string;
}

/**
 * Standardized back navigation link.
 */
export function BackLink({ href, label = "Back", className }: BackLinkProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
