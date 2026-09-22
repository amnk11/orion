"use client";

import { useState, useEffect } from "react";
import { useConnectivity } from "~/lib/offline/connectivity";
import { AlertCircle } from "lucide-react";

export function OfflineBanner() {
  const status = useConnectivity();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "online") return null;

  return (
    <div className="bg-warning/10 text-warning-foreground px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b border-warning/20 shrink-0">
      <AlertCircle className="size-4 text-warning" />
      <span className="text-foreground/90">You're offline. New referrals will be saved and synced when you're back online.</span>
    </div>
  );
}
