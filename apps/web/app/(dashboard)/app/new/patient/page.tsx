"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReferralDraft } from "../components/referral-draft-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ArrowRight, ChevronRight, ChevronLeft, Search, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { cn } from "~/lib/utils";

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
      <div className="mb-10">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-5 -ml-2.5 text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors" 
          onClick={() => router.push("/app")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Patient Information</h1>
        <p className="text-[15px] text-muted-foreground mt-2 font-medium">Select an existing patient or register a new one.</p>
      </div>

      <div className="flex bg-muted/30 p-1 rounded-[6px] mb-8 w-full border border-border/40">
        <button 
          className={cn(
            "flex-1 py-2 text-[13px] font-semibold rounded-[4px] transition-all duration-200 uppercase tracking-widest", 
            mode === "search" ? "bg-background shadow-sm text-primary ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
          )} 
          onClick={() => setMode("search")}
        >
          Search Existing
        </button>
        <button 
          className={cn(
            "flex-1 py-2 text-[13px] font-semibold rounded-[4px] transition-all duration-200 uppercase tracking-widest", 
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground/60" />
              <Label htmlFor="search-patients" className="sr-only">Search patients</Label>
              <Input 
                id="search-patients" 
                placeholder="Search by name, phone, or ID..." 
                className="pl-10 h-[46px] text-[15px] bg-background border-border/60 shadow-sm focus-visible:ring-primary/20 rounded-md"
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
                  <Loader2 className="size-5 animate-spin mr-2.5" /> <span className="text-[15px]">Loading...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/60 rounded-[12px] bg-muted/10">
                  <UserPlus className="size-8 text-muted-foreground/30 mb-4" />
                  <p className="text-[15px] font-medium text-foreground">
                    {searchQuery ? "No matching patients" : "No patients found"}
                  </p>
                  <p className="text-[13.5px] text-muted-foreground mt-1.5 max-w-[240px]">
                    Try adjusting your search or register a new patient.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-6 h-9 px-4 rounded-[6px] border-border/60"
                    onClick={() => setMode("register")}
                  >
                    Register New Patient
                  </Button>
                </div>
              ) : (
                <>
                  {paginatedPatients.map((p) => (
                    <Button
                      key={p.id}
                      variant="outline"
                      className={cn(
                        "w-full justify-between items-center h-auto p-4 transition-all bg-background hover:bg-muted/20 hover:border-border/80 rounded-[8px] shadow-none",
                        draft.patientId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/20 hover:border-primary" : "border-border/60"
                      )}
                      onClick={() => {
                        const details = [p.age ? `${p.age}y` : null, p.sex].filter(Boolean).join(", ");
                        setPatientId(p.id, p.displayName, details);
                        router.push("/app/new/protocol");
                      }}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-[15px] text-foreground tracking-tight">{p.displayName}</span>
                        <span className="text-[13px] text-muted-foreground/70 font-mono tracking-tight">{p.id.split('-')[0]}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[14px] text-muted-foreground/90">
                        <div className="flex items-center gap-1.5 font-medium">
                          {p.age && <span>{p.age}y</span>}
                          {p.age && p.sex && <span className="opacity-40">•</span>}
                          {p.sex && <span className="capitalize">{p.sex}</span>}
                        </div>
                        <ChevronRight className={cn("size-[18px] transition-colors", draft.patientId === p.id ? "text-primary" : "text-muted-foreground/40 group-hover:text-foreground/50")} />
                      </div>
                    </Button>
                  ))}
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 pb-8">
                      <p className="text-[13px] text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)}</span> of <span className="font-medium text-foreground">{filteredPatients.length}</span> patients
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="size-4" />
                          <span className="sr-only">Previous page</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
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
            <div className="space-y-6 bg-card/50 p-6 md:p-8 rounded-[12px] border border-border/60 shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[13px] font-semibold text-foreground uppercase tracking-wide">Full Name <span className="text-danger" aria-hidden="true">*</span></Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Maya Devi"
                  className="h-11 text-[15px] bg-background"
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
                  <p id="name-error" className="text-[13px] text-danger font-medium mt-1.5" role="alert">
                    {formError}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-[13px] font-semibold text-foreground uppercase tracking-wide">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    placeholder="e.g. 28"
                    className="h-11 text-[15px] bg-background"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex" className="text-[13px] font-semibold text-foreground uppercase tracking-wide">Sex</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(val) => setFormData({ ...formData, sex: val })}
                  >
                    <SelectTrigger id="sex" className="h-11 text-[15px] bg-background">
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
              <Button type="submit" size="lg" className="w-full md:w-auto px-8 font-semibold h-11 text-[15px] rounded-[6px]" disabled={createPatient.isPending}>
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
