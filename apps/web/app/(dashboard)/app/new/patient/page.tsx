"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "~/components/ui/empty";
import { ArrowRight, ChevronRight, ChevronLeft, Search, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { cn } from "~/lib/utils";
import { db } from "~/lib/offline/db";
import { connectivity } from "~/lib/offline/connectivity";
import { syncEngine } from "~/lib/offline/sync-engine";
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
  
  const [mode, setMode] = useState<"search" | "register">("search");
  const [formData, setFormData] = useState({ displayName: "", age: "", sex: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { data: patients, isLoading } = useQuery<{ ok: boolean; data: Patient[] }>({
    queryKey: ["patients"],
    queryFn: async () => {
      const cacheKey = "all_patients";
      try {
        const res = await fetch("/api/v1/patients");
        if (res.ok) {
          const json = await res.json();
          if (typeof window !== "undefined") {
            await db.referenceCache.put({ key: cacheKey, data: json, cachedAt: Date.now() });
          }
          return json;
        }
      } catch (e) {
        // network failure
      }
      if (typeof window !== "undefined") {
        const cached = await db.referenceCache.get(cacheKey);
        if (cached) return cached.data;
      }
      throw new Error("Failed to fetch");
    },
  });

  const filteredPatients = patients?.data?.filter((p) => 
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / ITEMS_PER_PAGE));
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        if (connectivity.status === "offline") {
          console.log("OFFLINE BRANCH EXECUTING");
          const patientId = crypto.randomUUID();
          
          console.log("QUEUEING PATIENT CREATION (OFFLINE)", patientId);
          await syncEngine.queuePatientCreation({
            ...payload,
            id: patientId,
          });
          console.log("QUEUED PATIENT CREATION (OFFLINE)", patientId);

          return {
            offline: true,
            data: { id: patientId, displayName: payload.displayName, age: payload.age, sex: payload.sex }
          };
        }
      }

      let res;
      try {
        res = await fetch("/api/v1/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.log("FALLBACK TRIGGERED", err);
        // Fallback to offline if fetch throws (e.g., network error before connectivity status updates)
        if (typeof window !== "undefined") {
          const patientId = crypto.randomUUID();
          console.log("QUEUEING PATIENT CREATION", patientId);
          await syncEngine.queuePatientCreation({
            ...payload,
            id: patientId,
          });
          console.log("QUEUED PATIENT CREATION", patientId);
          return {
            offline: true,
            data: { id: patientId, displayName: payload.displayName, age: payload.age, sex: payload.sex }
          };
        }
        throw err;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create patient");
      }
      return res.json();
    },
    onSuccess: (res) => {
      const p = res.data;
      const details = [p.age ? `${p.age}y` : null, p.sex].filter(Boolean).join(", ");
      setPatientId(p.id, p.displayName, p.age, details);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      router.push("/app/new/protocol");
    },
    onError: (err: Error) => {
      setFormError(err.message + " | " + (err.stack || ''));
    }
  });

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
    <div className="flex flex-col flex-1 w-full pb-16">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground transition-colors" 
          onClick={() => router.push("/app")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Patient Information</h1>
        <p className="text-base text-muted-foreground mt-2">Select an existing patient or register a new one.</p>
      </div>

      <div className="flex bg-muted/50 p-1 rounded-lg mb-8 w-full border border-border/50">
        <button 
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200", 
            mode === "search" ? "bg-background shadow-sm text-primary ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
          )} 
          onClick={() => setMode("search")}
        >
          Search Existing
        </button>
        <button 
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200", 
            mode === "register" ? "bg-background shadow-sm text-primary ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
          )} 
          onClick={() => setMode("register")}
        >
          Register New
        </button>
      </div>

      <div className="flex-1">
        {mode === "search" ? (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Label htmlFor="search-patients" className="sr-only">Search patients</Label>
              <Input 
                id="search-patients" 
                placeholder="Search by name, phone, or ID..." 
                className="pl-10 h-11 text-base bg-background shadow-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }} 
              />
            </div>
            
            <div className="space-y-3 pr-2 pb-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin mr-2" /> <span className="text-sm font-medium">Loading...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="py-12 border border-dashed border-border rounded-xl bg-muted/20">
                  <Empty>
                    <EmptyMedia variant="icon"><UserPlus className="text-muted-foreground/60" /></EmptyMedia>
                    <EmptyTitle>{searchQuery ? "No matching patients" : "No patients found"}</EmptyTitle>
                    <EmptyDescription>
                      Try adjusting your search or register a new patient to begin.
                    </EmptyDescription>
                    <EmptyContent>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setMode("register")}
                      >
                        Register New Patient
                      </Button>
                    </EmptyContent>
                  </Empty>
                </div>
              ) : (
                <>
                  {paginatedPatients.map((p) => (
                    <Button
                      key={p.id}
                      variant="outline"
                      className={cn(
                        "w-full justify-between items-center h-auto p-4 transition-all bg-background rounded-lg shadow-none",
                        draft.patientId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/50"
                      )}
                      onClick={() => {
                        const details = [p.age ? `${p.age}y` : null, p.sex].filter(Boolean).join(", ");
                        setPatientId(p.id, p.displayName, p.age, details);
                        router.push("/app/new/protocol");
                      }}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-base text-foreground tracking-tight">{p.displayName}</span>
                        <span className="text-sm text-muted-foreground font-mono tracking-tight">{p.id.split('-')[0]}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                          {p.age && <span>{p.age}y</span>}
                          {p.age && p.sex && <span className="opacity-40">•</span>}
                          {p.sex && <span className="capitalize">{p.sex}</span>}
                        </div>
                        <ChevronRight className={cn("size-4 transition-colors", draft.patientId === p.id ? "text-primary" : "text-muted-foreground/40")} />
                      </div>
                    </Button>
                  ))}
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 pb-8">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)}</span> of <span className="font-medium text-foreground">{filteredPatients.length}</span> patients
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="size-4" />
                          <span className="sr-only">Previous page</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="size-4" />
                          <span className="sr-only">Next page</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-300">
            <div className="space-y-6 bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-foreground">Full Name <span className="text-danger" aria-hidden="true">*</span></Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Maya Devi"
                  className="bg-background"
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
                  <div id="name-error" className="text-sm text-danger font-medium p-4 bg-danger/10" role="alert">
                    ERROR: {formError}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium text-foreground">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    placeholder="e.g. 28"
                    className="bg-background"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex" className="text-sm font-medium text-foreground">Sex</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(val) => setFormData({ ...formData, sex: val })}
                  >
                    <SelectTrigger id="sex" className="bg-background">
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
            
            <div className="mt-8 flex justify-end">
              <Button type="submit" size="lg" className="w-full md:w-auto px-8" disabled={createPatient.isPending}>
                {createPatient.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Register & Continue
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
