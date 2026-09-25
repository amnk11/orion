import { Calendar, User as UserIcon, Activity } from "lucide-react";
import { UrgencyBadge } from "~/components/ui/urgency-badge";

interface PatientSummaryProps {
  publicCode: string;
  name?: string;
  age?: number | string;
  sex?: string;
  protocolCode: string;
  urgency: string;
}

export function PatientSummary({ publicCode, name, age, sex, protocolCode, urgency }: PatientSummaryProps) {
  const protocolName = protocolCode === "anc_danger" ? "ANC Danger Signs" : "Adult General";

  return (
    <div className="bg-background border-b border-border py-4 px-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {name || "Synthetic Patient"}
            </h2>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {publicCode}
            </span>
            <UrgencyBadge level={urgency} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="tabular-nums">{age ? `${age} yrs` : "Unknown Age"}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-muted-foreground" />
            <span className="capitalize">{sex || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <span>{protocolName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
