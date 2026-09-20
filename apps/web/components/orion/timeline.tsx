import { format } from "date-fns";
import { Circle, User, Building2 } from "lucide-react";
import { ClinicalDictionary } from "~/lib/clinical-dictionary";
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
    <div className={cn("relative space-y-4 before:absolute before:inset-0 before:ml-2 before:h-full before:w-px before:bg-border", className)}>
      {events.map((event, index) => {
        const isFirst = index === 0;
        const formattedEvent = ClinicalDictionary.formatEvent(event.eventType);

        return (
          <div key={event.id} className="relative flex items-start">
            {/* Minimal Node */}
            <div className="flex items-center justify-center size-4 bg-background shrink-0 z-10 mt-1">
              <Circle className={cn("size-2.5", isFirst ? "fill-primary text-primary" : "fill-muted-foreground text-muted-foreground")} />
            </div>

            {/* Vertical Dense Rail Content */}
            <div className="ml-4 flex-1 pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className={cn("text-sm font-semibold", isFirst ? "text-foreground" : "text-muted-foreground")}>
                    {formattedEvent}
                  </span>
                  <time className="text-xs text-muted-foreground font-mono">
                    {format(new Date(event.createdAt), "h:mm a")}
                  </time>
                </div>

                {event.reason && (
                  <div className="text-sm text-foreground mt-1 mb-1">
                    {event.reason}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {event.actorRole && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="size-3.5" />
                      <span className="capitalize">{event.actorRole.replace("_", " ")}</span>
                    </div>
                  )}
                  {event.facilityId && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="size-3.5" />
                      <span className="font-mono text-[10px]">{event.facilityId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
