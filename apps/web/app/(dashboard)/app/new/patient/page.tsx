"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ArrowRight, Search, Loader2 } from "lucide-react";

interface Patient {
  id: string;
  displayName: string;
  age: number | null;
  sex: string | null;
}


export default function PatientSelectionPage() {
  const router = useRouter();
  const { setPatientId, draft } = useReferralDraft();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ displayName: "", age: "", sex: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients, isLoading } = useQuery<{ ok: boolean; data: Patient[] }>({
    queryKey: ["patients"],
    queryFn: async () => {
      const cacheKey = "all_patients";
      try {
        const res = await fetch("/api/v1/patients");
        if (res.ok) {
          const json = await res.json();
          if (typeof window !== "undefined") {
            const { db } = await import("~/lib/offline/db");
            await db.referenceCache.put({ key: cacheKey, data: json, cachedAt: Date.now() });
          }
          return json;
        }
      } catch (e) {
        // network failure
      }
      if (typeof window !== "undefined") {
        const { db } = await import("~/lib/offline/db");
        const cached = await db.referenceCache.get(cacheKey);
        if (cached) return cached.data;
      }
      throw new Error("Failed to fetch");
    },
  });

  const filteredPatients = patients?.data?.filter((p) => 
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const createPatient = useMutation({
    mutationFn: async (data: typeof formData) => {
      const idempotencyKey = crypto.randomUUID();
      const payload = {
        displayName: data.displayName,
        age: data.age ? parseInt(data.age, 10) : undefined,
        sex: data.sex || undefined,
        idempotencyKey,
      };

      if (typeof window !== "undefined") {
        const { connectivity } = await import("~/lib/offline/connectivity");
        if (connectivity.status !== "online") {
          const { syncEngine } = await import("~/lib/offline/sync-engine");
          const patientId = crypto.randomUUID();
          
          await syncEngine.queuePatientCreation({
            ...payload,
            id: patientId,
          });

          return {
            offline: true,
            data: { id: patientId, displayName: payload.displayName, age: payload.age, sex: payload.sex }
          };
        }
      }

      const res = await fetch("/api/v1/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create patient");
      }
      return res.json();
    },
    onSuccess: (res) => {
      const p = res.data;
      const details = [p.age ? `${p.age}y` : null, p.sex].filter(Boolean).join(", ");
      setPatientId(p.id, p.displayName, details);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      router.push("/app/new/protocol");
    },
    onError: (err: Error) => {
      setFormError(err.message);
    }
  });

  const handleSelectPatient = (id: string) => {
    setPatientId(id);
    router.push("/app/new/protocol");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setFormError("Patient name is required to begin a referral.");
      return;
    }
    setFormError(null);
    createPatient.mutate(formData);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Patient Information</h1>
        <p className="text-sm text-muted-foreground mt-1">Select an existing patient or register a new one to begin the referral.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16 flex-1">
        
        {/* Existing Patients */}
        <div className="flex flex-col">
          <h2 className="text-lg font-medium text-foreground mb-1">Existing Patients</h2>
          <p className="text-sm text-muted-foreground mb-6">Select a recently registered patient</p>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Label htmlFor="search-patients" className="sr-only">Search patients</Label>
              <Input 
                id="search-patients" 
                placeholder="Search patients..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mr-2" /> Loading...
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-border rounded-md bg-muted/30">
                  {searchQuery ? "No patients match your search." : "No patients found."}
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className={`w-full justify-between h-auto p-3 ${
                      draft.patientId === p.id ? "border-ring bg-accent" : ""
                    }`}
                    onClick={() => {
                      const details = [p.age ? `${p.age}y` : null, p.sex].filter(Boolean).join(", ");
                      setPatientId(p.id, p.displayName, details);
                      router.push("/app/new/protocol");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{p.displayName}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {p.age && <span>{p.age}y</span>}
                      {p.sex && <span className="capitalize">{p.sex}</span>}
                      <ArrowRight className="size-4" />
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* New Patient Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-medium text-foreground">Register New Patient</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Create a profile to initiate a referral</p>
          
          <div className="space-y-5 flex-1 bg-muted/20 p-5 rounded-lg border border-border/50">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Full Name <span className="text-danger" aria-hidden="true">*</span></Label>
              <Input
                id="displayName"
                placeholder="e.g. Maya Devi"
                value={formData.displayName}
                onChange={(e) => {
                  setFormData({ ...formData, displayName: e.target.value });
                  if (formError) setFormError(null);
                }}
                aria-invalid={!!formError}
                aria-describedby={formError ? "name-error" : undefined}
                required
              />
              {formError && (
                <p id="name-error" className="text-xs text-danger font-medium mt-1.5" role="alert">
                  {formError}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  placeholder="e.g. 28"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(val) => setFormData({ ...formData, sex: val })}
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <Button type="submit" size="lg" className="w-full font-semibold" disabled={createPatient.isPending}>
              {createPatient.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Register & Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
