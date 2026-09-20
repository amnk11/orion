import { useEffect, useState } from "react";

export type ConnectionStatus = "online" | "offline" | "checking";

class ConnectivityMonitor {
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  public status: ConnectionStatus = typeof window !== "undefined" && navigator.onLine ? "online" : "offline";

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
      // Perform periodic probe to detect captive portals / pseudo-online states
      setInterval(this.probe, 30000); 
    }
  }

  private handleOnline = () => {
    // Probe immediately to confirm real internet
    this.probe();
  };

  private handleOffline = () => {
    this.setStatus("offline");
  };

  private probe = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setStatus("offline");
      return;
    }
    
    this.setStatus("checking");
    try {
      const res = await fetch("/api/health", { cache: "no-store", method: "HEAD" });
      if (res.ok) {
        this.setStatus("online");
      } else {
        this.setStatus("offline");
      }
    } catch {
      this.setStatus("offline");
    }
  };

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.listeners.forEach(l => l(newStatus));
    }
  }

  public subscribe(listener: (status: ConnectionStatus) => void) {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const connectivity = new ConnectivityMonitor();

export function useConnectivity() {
  const [status, setStatus] = useState<ConnectionStatus>(connectivity.status);

  useEffect(() => {
    return connectivity.subscribe(setStatus);
  }, []);

  return status;
}
