import { FileText, User as UserIcon, Calendar, Activity } from "lucide-react";
import { UrgencyBadge } from "./urgency-badge";

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
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-slate-500 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              {publicCode}
            </span>
            <UrgencyBadge level={urgency} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
            {name || "Synthetic Patient"}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:flex items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-slate-400" />
            <span>{age ? `${age} yrs` : "Unknown Age"}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-slate-400" />
            <span className="capitalize">{sex || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
            <Activity className="size-4 text-slate-400" />
            <span>{protocolName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
