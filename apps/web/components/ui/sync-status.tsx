import { CheckCircle2, Cloud, CloudOff, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export type SyncStatusValue = "pending" | "syncing" | "synced" | "failed" | "conflict";

const STATES: Record<SyncStatusValue, { label: string; description: string; icon: typeof Cloud; className: string }> = {
  pending: { label: "Saved on this device", description: "Waiting for a connection before it can be sent to the server.", icon: CloudOff, className: "border-warning/30 bg-warning/10 text-warning" },
  syncing: { label: "Syncing to server", description: "This referral is being sent to the server.", icon: LoaderCircle, className: "border-info/30 bg-info/10 text-info" },
  synced: { label: "Synced to server", description: "The server has received this referral.", icon: CheckCircle2, className: "border-success/30 bg-success/10 text-success" },
  failed: { label: "Sync failed", description: "This referral remains on this device. Retry when the connection is available.", icon: RefreshCw, className: "border-danger/30 bg-danger/10 text-danger" },
  conflict: { label: "Conflict needs review", description: "The server could not safely apply this referral. Review it before continuing.", icon: TriangleAlert, className: "border-warning/40 bg-warning/10 text-warning" },
};

export function SyncStatus({ status, compact = false }: { status: SyncStatusValue; compact?: boolean }) {
  const state = STATES[status];
  const Icon = state.icon;
  return (
    <Badge variant="outline" className={state.className} aria-label={`Sync status: ${state.label}. ${state.description}`} title={state.description}>
      <Icon className={status === "syncing" ? "animate-spin" : undefined} aria-hidden="true" />
      <span>{compact ? state.label.replace(" on this device", " locally").replace(" to server", "") : state.label}</span>
    </Badge>
  );
}

/**
 * Narrows an arbitrary string (e.g. a value coming out of the local offline
 * database) to a known sync state. Unknown values return null so the UI never
 * claims a sync state it cannot justify.
 */
export function toSyncStatus(value: string | null | undefined): SyncStatusValue | null {
  if (!value) return null;
  return value in STATES ? (value as SyncStatusValue) : null;
}
