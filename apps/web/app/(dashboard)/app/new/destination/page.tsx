"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Building2, CheckCircle2, MapPin, Loader2, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  CapabilityStatusRow,
  type CapabilityView,
} from "~/components/orion/capability-status";
import { db } from "~/lib/offline/db";

interface Facility {
  id: string;
  name: string;
  type: string;
}

type Capability = CapabilityView;

function FacilityCard({ facility, selected, onSelect }: { facility: Facility, selected: boolean, onSelect: () => void }) {
  const { data: caps, isLoading } = useQuery<{ ok: boolean; data: Capability[] }>({
    queryKey: ["capabilities", facility.id],
    queryFn: async () => {
      const cacheKey = `capabilities_${facility.id}`;
      try {
        const res = await fetch(`/api/v1/facilities/${facility.id}/capabilities`);
        if (res.ok) {
          const json = await res.json();
          if (typeof window !== "undefined") {
            await db.referenceCache.put({ key: cacheKey, data: json, cachedAt: Date.now() });
          }
          return json as { ok: boolean; data: Capability[] };
        }
      } catch {
        // network error
      }
      
      if (typeof window !== "undefined") {
        const cached = await db.referenceCache.get(cacheKey);
        if (cached) return cached.data as { ok: boolean; data: Capability[] };
      }
      throw new Error("Failed to fetch capabilities");
    },
  });

  return (
    <button 
      type="button"
      onClick={onSelect}
      className={`cursor-pointer transition-all text-left hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex flex-col p-4 rounded-xl border bg-card ${selected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
    >
      <div className="flex justify-between items-start mb-4 w-full">
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
      
      <div className="flex flex-col gap-2 mt-auto w-full">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Reported Capabilities
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Loading status...
          </div>
        ) : caps?.data && caps.data.length > 0 ? (
          <div className="flex flex-col gap-2">
            {caps.data.map((cap: Capability) => (
              <CapabilityStatusRow key={cap.id} capability={cap} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">No capability data available</div>
        )}
        <p className="text-[10px] text-muted-foreground/80 leading-snug">
          Capability information is a point-in-time snapshot reported by the facility, not a
          live availability feed.
        </p>
      </div>
    </button>
  );
}

export default function DestinationSelectionPage() {
  const router = useRouter();
  const { draft, setDestinationFacilityId } = useReferralDraft();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!draft.isComplete) {
      router.replace("/app/new/clinical");
    }
  }, [draft.isComplete, router]);

  const { data: facilities, isLoading } = useQuery<{ ok: boolean; data: Facility[] }>({
    queryKey: ["facilities"],
    queryFn: async () => {
      const cacheKey = "all_facilities";
      try {
        const res = await fetch("/api/v1/facilities");
        if (res.ok) {
          const json = await res.json();
          if (typeof window !== "undefined") {
            await db.referenceCache.put({ key: cacheKey, data: json, cachedAt: Date.now() });
          }
          return json as { ok: boolean; data: Facility[] };
        }
      } catch {
        // Network error
      }
      
      if (typeof window !== "undefined") {
        const cached = await db.referenceCache.get(cacheKey);
        if (cached) return cached.data as { ok: boolean; data: Facility[] };
      }
      throw new Error("Failed to fetch facilities");
    },
  });

  const filteredFacilities: Facility[] = (facilities?.data ?? []).filter((facility: Facility) =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isNavigating, setIsNavigating] = useState(false);

  const handleNext = () => {
    if (draft.destinationFacilityId) {
      setIsNavigating(true);
      router.push("/app/new/confirm");
    }
  };

  if (!draft.isComplete) return null;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Select Destination</h1>
        <p className="text-base text-muted-foreground mt-2">Choose where to send this referral.</p>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input 
          placeholder="Search facilities..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 flex-1">
        {isLoading ? (
          <div className="col-span-2 py-12 flex justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-sm text-muted-foreground border border-border rounded-md bg-muted/30">
            No facilities found matching your search.
          </div>
        ) : (
          filteredFacilities.map((facility: Facility) => (
            <FacilityCard 
              key={facility.id}
              facility={facility}
              selected={draft.destinationFacilityId === facility.id}
              onSelect={() => setDestinationFacilityId(facility.id)}
            />
          ))
        )}
      </div>

      {/* Fixed Action Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 md:static md:bg-transparent md:border-0 md:p-0 md:pt-8 mt-auto z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between w-full pb-safe">
          <Button variant="ghost" onClick={() => router.push("/app/new/clinical")}>
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!draft.destinationFacilityId}
            size="lg"
          >
            Review & Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}



