"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useReferralDraft } from "../components/referral-draft-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
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
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md group ${selected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800'}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="size-5 text-slate-400" />
              {facility.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="size-3" /> {facility.type?.toUpperCase() || "UNKNOWN"}
            </CardDescription>
          </div>
          {selected && <CheckCircle2 className="size-5 text-blue-600" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Known Capabilities</div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-3 animate-spin" /> Loading status...
            </div>
          ) : caps?.data && caps.data.length > 0 ? (
            <div className="space-y-2">
              {caps.data.map(cap => (
                <div key={cap.id} className="flex flex-col gap-1 p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                      {cap.serviceCode.replace("_", " ")}
                    </span>
                    <Badge variant="outline" className={cap.status === "available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}>
                      {cap.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="size-3" /> 
                    Verified {formatDistanceToNow(new Date(cap.attestedAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">No capability data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { PageHeader } from "~/components/orion/page-header";

export default function DestinationSelectionPage() {
  const router = useRouter();
  const { draft, setDestinationFacilityId } = useReferralDraft();

  useEffect(() => {
    if (!draft.isComplete) {
      router.replace("/app/new/form");
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
    <div className="space-y-6">
      <PageHeader 
        title="Select Destination" 
        description="Step 4 of 4. Choose where to send this referral."
        action={
          <Button 
            onClick={handleNext} 
            disabled={!draft.destinationFacilityId}
            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            Review & Confirm
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input placeholder="Search facilities..." className="pl-9" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 flex justify-center text-slate-500">
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
    </div>
  );
}
