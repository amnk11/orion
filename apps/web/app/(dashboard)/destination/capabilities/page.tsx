"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useSessionUser } from "~/hooks/use-session-user";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { PageHeader } from "~/components/orion/page-header";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import {
  verifiedLabel,
  type CapabilityView,
  type CapabilityBusinessStatus,
} from "~/components/orion/capability-status";

const SERVICE_CODES = ["obgyn", "functional_ot", "blood_bank", "icu", "lab"] as const;

const SERVICE_LABELS: Record<string, string> = {
  obgyn: "ObGyn",
  functional_ot: "Functional OT",
  blood_bank: "Blood Bank",
  icu: "ICU",
  lab: "Laboratory",
};

const STATUS_OPTIONS: Array<{ value: CapabilityBusinessStatus; label: string }> = [
  { value: "AVAILABLE", label: "Available" },
  { value: "UNAVAILABLE", label: "Unavailable" },
  { value: "UNKNOWN", label: "Unknown" },
];

const STATUS_BADGE_VARIANT: Record<CapabilityBusinessStatus, "status-success" | "status-neutral"> = {
  AVAILABLE: "status-success",
  UNAVAILABLE: "status-neutral",
  UNKNOWN: "status-neutral",
};

const STATUS_LABEL: Record<CapabilityBusinessStatus, string> = {
  AVAILABLE: "Available",
  UNAVAILABLE: "Unavailable",
  UNKNOWN: "Unknown",
};

interface CapabilityEditorProps {
  facilityId: string;
  serviceCode: string;
  existing: CapabilityView | null;
}

function CapabilityEditor({ facilityId, serviceCode, existing }: CapabilityEditorProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<CapabilityBusinessStatus>(
    existing?.status ?? "UNKNOWN"
  );
  const [note, setNote] = React.useState(existing?.note ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Keep local state in sync when the snapshot refreshes after save.
  React.useEffect(() => {
    setStatus(existing?.status ?? "UNKNOWN");
    setNote(existing?.note ?? "");
  }, [existing?.id, existing?.attestedAt, existing?.status, existing?.note]);

  const isDirty =
    status !== (existing?.status ?? "UNKNOWN") || note !== (existing?.note ?? "");

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/facilities/${facilityId}/capabilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode,
          status,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message || "Failed to save capability");
      }
      setFeedback({ kind: "success", message: "Saved · verified just now" });
      await queryClient.invalidateQueries({ queryKey: ["capabilities", facilityId] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save capability";
      setFeedback({ kind: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatus: CapabilityBusinessStatus = existing?.status ?? "UNKNOWN";
  const isStale = existing?.freshness === "STALE";
  const isVeryStale = !existing || existing.freshness === "VERY_STALE";

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{SERVICE_LABELS[serviceCode]}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Current:</span>
            <Badge variant={STATUS_BADGE_VARIANT[currentStatus]}>
              {STATUS_LABEL[currentStatus]}
            </Badge>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            isVeryStale
              ? "text-warning font-medium"
              : isStale
                ? "text-warning/90"
                : "text-muted-foreground"
          )}
        >
          {isStale || isVeryStale ? (
            <AlertTriangle className="size-3.5 shrink-0" />
          ) : (
            <Clock className="size-3.5 shrink-0" />
          )}
          {existing ? verifiedLabel(existing) : "Not verified yet"}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={status === option.value ? "default" : "outline"}
            onClick={() => setStatus(option.value)}
            aria-pressed={status === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Optional note (e.g. OT under maintenance until Friday)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="min-h-5 text-xs" aria-live="polite">
          {feedback?.kind === "success" && (
            <span className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-3.5" /> {feedback.message}
            </span>
          )}
          {feedback?.kind === "error" && (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="size-3.5" /> {feedback.message}
            </span>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving || !isDirty} size="sm">
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
export default function DestinationCapabilitiesPage() {
  const router = useRouter();
  const { user, isPending, isDestination, isAdmin } = useSessionUser();
  const facilityId: string | undefined = user?.facilityId;

  React.useEffect(() => {
    if (!isPending) {
      if (!user) {
        router.replace("/login");
      } else if (!isDestination && !isAdmin) {
        router.replace("/");
      }
    }
  }, [user, isPending, router, isDestination, isAdmin]);

  const { data: response, isLoading } = useQuery<{ ok: boolean; data: CapabilityView[] }>({
    queryKey: ["capabilities", facilityId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/facilities/${facilityId}/capabilities`);
      if (!res.ok) throw new Error("Failed to fetch capabilities");
      return res.json();
    },
    enabled: !!facilityId && (isDestination || isAdmin),
  });

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span>Verifying session...</span>
        </div>
      </main>
    );
  }

  if (!user || (!isDestination && !isAdmin)) return null;

  const byServiceCode = new Map<string, CapabilityView>();
  for (const cap of response?.data ?? []) {
    byServiceCode.set(cap.serviceCode, cap);
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 md:space-y-8">
      <PageHeader
        title="Facility Capabilities"
        description="Report what your facility can currently provide. Origin teams see these as time-stamped snapshots when choosing a referral destination."
      />

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        Saving a status records a new verification timestamp. Origin teams see how long ago each
        capability was verified — outdated information is visibly marked as stale, so please keep
        this page up to date.
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !facilityId ? (
        <div className="py-12 text-center text-sm text-muted-foreground border border-border rounded-md bg-muted/30">
          Your account is not assigned to a facility.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SERVICE_CODES.map((code) => (
            <CapabilityEditor
              key={code}
              facilityId={facilityId}
              serviceCode={code}
              existing={byServiceCode.get(code) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
