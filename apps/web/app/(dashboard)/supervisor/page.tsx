"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSessionUser } from "~/hooks/use-session-user";
import { LayoutDashboard } from "lucide-react";
import { Spinner } from "~/components/ui/spinner";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "~/components/ui/empty";

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const { user, isPending, session, isOrigin, isDestination, isSupervisor } = useSessionUser();

  React.useEffect(() => {
    if (!isPending) {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (isOrigin) router.replace("/app");
      else if (isDestination) router.replace("/destination");
      else if (!isSupervisor) router.replace("/login");
    }
  }, [user, isPending, router, isOrigin, isDestination, isSupervisor]);

  if (isPending) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span>Verifying session...</span>
        </div>
      </main>
    );
  }

  if (!user || !isSupervisor) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 w-full flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 flex items-center justify-center">
        <Empty className="max-w-md w-full border border-border shadow-sm bg-card p-12">
          <EmptyMedia variant="icon">
            <LayoutDashboard className="size-12 text-primary opacity-20" />
          </EmptyMedia>
          <EmptyTitle>Oversight Analytics</EmptyTitle>
          <EmptyDescription>
            District-wide metrics, aging referrals, and capability audits are currently being provisioned.
          </EmptyDescription>
          <EmptyContent>
            <div className="mt-4 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-mono">
              Role: {user.role} | {user.email}
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}
