"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ArrowRight, UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  displayName: string;
  age: number | null;
  sex: string | null;
}

import { PageHeader } from "~/components/orion/page-header";

export default function PatientSelectionPage() {
  const router = useRouter();
  const { setPatientId, draft } = useReferralDraft();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
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
    <div className="space-y-6">
      <PageHeader 
        title="Select Patient" 
        description="Step 1 of 4. Who is this referral for?" 
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Existing Patients */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Existing Patients</CardTitle>
            <CardDescription>Select a recently registered patient</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input placeholder="Search patients..." className="pl-9" />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8 text-slate-500">
                    <Loader2 className="size-5 animate-spin mr-2" /> Loading...
                  </div>
                ) : patients?.data?.length === 0 ? (
                  <div className="text-center p-8 text-sm text-slate-500 border border-dashed rounded-md">
                    No patients found. Create one.
                  </div>
                ) : (
                  patients?.data?.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p.id)}
                      className={`w-full text-left p-3 rounded-md border transition-colors flex items-center justify-between group ${
                        draft.patientId === p.id 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{p.displayName}</div>
                        <div className="text-xs text-slate-500">
                          {p.age ? `${p.age} yrs` : "Age unknown"} • {p.sex ? p.sex : "Unspecified"}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Patient Form */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="size-5 text-blue-600" />
              New Patient
            </CardTitle>
            <CardDescription>Register a new patient at this facility</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Maya Devi"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900" disabled={createPatient.isPending}>
                {createPatient.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Create & Continue
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
