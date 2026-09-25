"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle, Clock, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { PageShell } from "~/components/orion/page-shell";
import { SegmentedControl } from "~/components/ui/segmented-control";

export default function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["follow-ups", filter],
    queryFn: async () => {
      const statusParam = filter === "all" ? "" : filter;
      const res = await fetch(`/api/v1/follow-ups?status=${statusParam}`);
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/follow-ups/${id}/complete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      toast.success("Follow-up marked as complete");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const followUps = data?.data || [];

  return (
    <PageShell maxWidth="standard">
      
      {/* Premium Header Area */}
      <div className="flex flex-col gap-6 mb-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Follow-Ups
          </h2>
          <p className="text-muted-foreground mt-1.5 text-base">
            Manage pending tasks and review completed actions across all patient handoffs.
          </p>
        </div>

        {/* Segmented Filter Control */}
        <SegmentedControl
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "pending", label: "Pending" },
            { value: "completed", label: "Completed" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4 mt-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-card/30 mt-6">
          <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="size-6 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No follow-ups</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {filter === "pending" 
              ? "There are no pending follow-up tasks at this time. You're all caught up!"
              : "No follow-up records found matching the current filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-6">
          {followUps.map((fup: any) => {
            const isOverdue = fup.status === "pending" && new Date(fup.dueAt) < new Date();
            const isCompleted = fup.status === "completed";
            
            return (
              <div 
                key={fup.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 bg-card border border-border rounded-xl hover:shadow-sm transition-all relative overflow-hidden"
              >
                {/* Subtle Status Indicator Line on Left Edge */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                    isCompleted ? "bg-success/60" : isOverdue ? "bg-danger/60" : "bg-primary/60"
                  }`} 
                />

                <div className="flex flex-col gap-3 pl-3 w-full">
                  <div className="flex flex-wrap items-start justify-between gap-3 w-full">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-foreground leading-none">
                          {fup.patientName || "Unknown Patient"}
                        </span>
                        {fup.publicCode && (
                          <Link 
                            href={`/app/handoff/${fup.handoffId}`} 
                            className="text-muted-foreground text-xs font-mono bg-muted/60 px-2 py-0.5 rounded hover:bg-muted hover:text-primary transition-colors"
                          >
                            {fup.publicCode}
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl pr-4">
                        {fup.task}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center shrink-0">
                      {isOverdue && (
                        <span className="inline-flex items-center text-xs font-medium bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
                          <AlertCircle className="size-3.5 mr-1.5" /> Overdue
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center text-xs font-medium bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="size-3.5 mr-1.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground gap-1.5 font-medium mt-1">
                    <Clock className="size-3.5 text-muted-foreground/80" /> 
                    <span>Due {format(new Date(fup.dueAt), "MMM d, yyyy")}</span>
                    {isCompleted && fup.completedAt && (
                      <>
                        <span className="mx-2 opacity-30">•</span>
                        <span>Completed {format(new Date(fup.completedAt), "MMM d, yyyy")}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Action Area */}
                <div className="w-full md:w-auto md:shrink-0 flex items-center md:pl-6 md:border-l border-border/50 pt-2 md:pt-0">
                  {fup.status === "pending" && (
                    <Button 
                      className="w-full md:w-auto md:min-w-[140px] font-medium"
                      onClick={() => completeMutation.mutate(fup.id)}
                      disabled={completeMutation.isPending}
                      aria-label={`Mark follow-up for ${fup.patientName} complete`}
                    >
                      {completeMutation.isPending ? "Marking..." : "Mark Complete"}
                    </Button>
                  )}
                  {isCompleted && (
                    <Button 
                      variant="outline" 
                      className="w-full md:w-auto md:min-w-[140px] text-muted-foreground border-dashed bg-transparent" 
                      disabled
                    >
                      <Check className="size-4 mr-2" /> Done
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
