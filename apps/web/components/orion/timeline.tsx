import { formatDistanceToNow, format } from "date-fns";
import { Circle, User, Building2 } from "lucide-react";
import { StatusBadge } from "~/components/ui/status-badge";
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
    <div className={cn("relative space-y-6 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-border", className)}>
      {events.map((event, index) => {
        const isFirst = index === 0;

        return (
          <div key={event.id} className="relative flex items-start md:odd:flex-row-reverse group">
            {/* Minimal Node */}
            <div className="flex items-center justify-center size-4 bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mt-1">
              <Circle className={cn("size-2.5", isFirst ? "fill-primary text-primary" : "fill-muted-foreground text-muted-foreground")} />
            </div>

            {/* Content (Flat section instead of card) */}
            <div className="w-[calc(100%-1.5rem)] ml-4 md:ml-0 md:w-[calc(50%-1.5rem)] pb-4 md:group-odd:pr-6 md:group-even:pl-6 border-b border-border/50 last:border-0">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge state={event.eventType} />
                  <time className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>{format(new Date(event.createdAt), "h:mm a")}</span>
                  </time>
                </div>

                <div className="text-sm text-foreground mt-1">
                  {event.reason && (
                    <div className="text-muted-foreground italic mb-2">
                      &quot;{event.reason}&quot;
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {event.actorRole && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3.5" />
                        <span className="capitalize">{event.actorRole.replace("_", " ")}</span>
                        {event.actorId && <span className="font-mono text-[10px]">{event.actorId}</span>}
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
          </div>
        );
      })}
    </div>
  );
}
