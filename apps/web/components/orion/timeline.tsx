import { formatDistanceToNow, format } from "date-fns";
import { Circle, User, Building2 } from "lucide-react";
import { StateBadge } from "./state-badge";
import { cn } from "~/lib/utils";

export interface TimelineEventData {
  id: string;
  eventType: string;
  actorId: string | null;
  actorRole: string | null;
  facilityId: string | null;
  reason: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface TimelineProps {
  events: TimelineEventData[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className={cn("relative space-y-6 before:absolute before:inset-0 before:ml-[13px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent", className)}>
      {events.map((event, index) => {
        const isFirst = index === 0;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center size-7 rounded-full border-2 bg-white dark:bg-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10",
              isFirst ? "border-blue-500 text-blue-500" : "border-slate-200 dark:border-slate-700 text-slate-400"
            )}>
              <Circle className={cn("size-3", isFirst && "fill-current")} />
            </div>

            {/* Content Card */}
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <StateBadge state={event.eventType} />
                  <time className="text-xs font-medium text-slate-500 flex flex-col items-end">
                    <span>{format(new Date(event.createdAt), "h:mm a")}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </span>
                  </time>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {event.reason && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-md border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic mb-2">
                      &quot;{event.reason}&quot;
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 mt-2">
                    {event.actorRole && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="size-3.5" />
                        <span className="capitalize">{event.actorRole.replace("_", " ")}</span>
                        {event.actorId && <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded truncate max-w-[120px]">{event.actorId}</span>}
                      </div>
                    )}
                    {event.facilityId && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="size-3.5" />
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded truncate max-w-[120px]">{event.facilityId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
