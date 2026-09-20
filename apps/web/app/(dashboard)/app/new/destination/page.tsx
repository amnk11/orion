"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useReferralDraft } from "../components/referral-draft-context";
import { Building2, CheckCircle2, Clock, MapPin, Loader2, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface Facility {
  id: string;
  name: string;
  type: string;
}

interface Capability {
  id: string;
  serviceCode: string;
  status: string;
  attestedAt: string;
}

function FacilityCard({ facility, selected, onSelect }: { facility: Facility, selected: boolean, onSelect: () => void }) {
  const { data: caps, isLoading } = useQuery<{ ok: boolean; data: Capability[] }>({
    queryKey: ["capabilities", facility.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/facilities/${facility.id}/capabilities`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  return (
    <div 
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onClick={onSelect}
      className={`cursor-pointer transition-all text-left hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex flex-col p-4 rounded-lg border bg-card ${selected ? 'border-ring ring-1 ring-ring bg-accent dark:bg-accent/20' : 'border-border'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            {facility.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {facility.type?.toUpperCase() || "UNKNOWN"}
          </div>
        </div>
        {selected && <CheckCircle2 className="size-5 text-primary shrink-0" />}
      </div>
      
      <div className="flex flex-col gap-2 mt-auto">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Known Capabilities</div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Loading status...
          </div>
        ) : caps?.data && caps.data.length > 0 ? (
          <div className="flex flex-col gap-2">
            {caps.data.map(cap => (
              <div key={cap.id} className="flex flex-col gap-1 p-2 rounded-md bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize text-foreground">
                    {cap.serviceCode.replace("_", " ")}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${cap.status === "available" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {cap.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="size-3" /> 
                  Verified {formatDistanceToNow(new Date(cap.attestedAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">No capability data available</div>
        )}
      </div>
    </div>
  );
}

export default function DestinationSelectionPage() {
  const router = useRouter();
  const { draft, setDestinationFacilityId } = useReferralDraft();

  useEffect(() => {
    if (!draft.isComplete) {
      router.replace("/app/new/clinical");
    }
  }, [draft.isComplete, router]);

  const { data: facilities, isLoading } = useQuery<{ ok: boolean; data: Facility[] }>({
    queryKey: ["facilities"],
    queryFn: async () => {
      const res = await fetch("/api/v1/facilities");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleNext = () => {
    if (draft.destinationFacilityId) {
      router.push("/app/new/confirm");
    }
  };

  if (!draft.isComplete) return null;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Select Destination</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose where to send this referral.</p>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search facilities..." className="pl-9" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 flex-1">
        {isLoading ? (
          <div className="col-span-2 py-12 flex justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          facilities?.data?.map(fac => (
            <FacilityCard 
              key={fac.id} 
              facility={fac} 
              selected={draft.destinationFacilityId === fac.id}
              onSelect={() => setDestinationFacilityId(fac.id)}
            />
          ))
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 md:static md:bg-transparent md:border-none md:p-0 md:mt-12 md:pt-6 md:border-t">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <Button variant="ghost" onClick={() => router.push("/app/new/clinical")}>
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!draft.destinationFacilityId}
          >
            Review & Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
