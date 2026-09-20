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
    <div className="bg-amber-100 text-amber-900 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b border-amber-200 shrink-0">
      <AlertCircle className="size-4" />
      <span>You're offline. New referrals will be saved and synced when you're back online.</span>
    </div>
  );
}
