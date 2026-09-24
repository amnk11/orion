"use client";

import { useState, useEffect } from "react";
import { useConnectivity } from "~/lib/offline/connectivity";
import { CloudOff, LoaderCircle } from "lucide-react";

export function OfflineBanner() {
  const status = useConnectivity();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "online") return null;

  const isChecking = status === "checking";

  return (
    <div role="status" className="bg-warning/10 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border-b border-warning/30 shrink-0">
      {isChecking ? <LoaderCircle className="size-4 text-info animate-spin" aria-hidden="true" /> : <CloudOff className="size-4 text-warning" aria-hidden="true" />}
      <span className="text-foreground">
        {isChecking ? "Checking connection…" : "Offline — new referrals can be saved on this device, but have not been sent to the server."}
      </span>
    </div>
  );
}
