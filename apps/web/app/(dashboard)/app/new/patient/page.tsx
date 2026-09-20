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
import { toast } from "sonner";

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

  const { data: patients, isLoading } = useQuery<{ ok: boolean; data: Patient[] }>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/v1/patients");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createPatient = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        displayName: data.displayName,
        age: data.age ? parseInt(data.age, 10) : undefined,
        sex: data.sex || undefined,
      };
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
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setPatientId(res.data.id);
      router.push("/app/new/protocol");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const handleSelectPatient = (id: string) => {
    setPatientId(id);
    router.push("/app/new/protocol");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName) {
      toast.error("Patient name is required");
      return;
    }
    createPatient.mutate(formData);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Patient Information</h1>
        <p className="text-sm text-muted-foreground mt-1">Select an existing patient or register a new one to begin the referral.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 flex-1 relative">
        {/* Divider */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

        {/* Existing Patients */}
        <div className="flex flex-col">
          <h2 className="text-lg font-medium text-foreground mb-1">Existing Patients</h2>
          <p className="text-sm text-muted-foreground mb-6">Select a recently registered patient</p>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Label htmlFor="search-patients" className="sr-only">Search patients</Label>
              <Input id="search-patients" placeholder="Search patients..." className="pl-9" />
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mr-2" /> Loading...
                </div>
              ) : patients?.data?.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-md">
                  No patients found.
                </div>
              ) : (
                patients?.data?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className={`w-full text-left p-3 rounded-md border transition-colors flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      draft.patientId === p.id 
                        ? "border-ring bg-accent dark:bg-accent/20" 
                        : "border-border hover:border-border/80 hover:bg-muted"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-foreground">{p.displayName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {p.age ? `${p.age} yrs` : "Age unknown"} &bull; {p.sex ? <span className="capitalize">{p.sex}</span> : "Unspecified"}
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
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
          
          <div className="space-y-5 flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Full Name <span className="text-danger">*</span></Label>
              <Input
                id="displayName"
                placeholder="e.g. Maya Devi"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
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
            <Button type="submit" className="w-full" disabled={createPatient.isPending}>
              {createPatient.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Register & Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
