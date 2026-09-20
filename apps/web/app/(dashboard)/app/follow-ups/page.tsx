"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

export default function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "completed" | "">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["follow-ups", filter],
    queryFn: async () => {
      const res = await fetch(`/api/v1/follow-ups?status=${filter}`);
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Follow-Ups Worklist
        </h1>
        <div className="flex gap-2">
          <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
            Pending
          </Button>
          <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")}>
            Completed
          </Button>
          <Button variant={filter === "" ? "default" : "outline"} onClick={() => setFilter("")}>
            All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
          No follow-ups found for this filter.
        </div>
      ) : (
        <div className="grid gap-4">
          {followUps.map((fup: any) => {
            const isOverdue = fup.status === "pending" && new Date(fup.dueAt) < new Date();
            return (
              <div key={fup.id} className="border rounded-lg p-6 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{fup.patientName || "Unknown Patient"}</span>
                    {fup.publicCode && (
                      <Link href={`/app/handoff/${fup.handoffId}`} className="text-primary text-sm hover:underline">
                        ({fup.publicCode})
                      </Link>
                    )}
                    {isOverdue && (
                      <span className="inline-flex items-center text-xs font-medium bg-danger/10 text-danger px-2 py-0.5 rounded ml-2">
                        <AlertCircle className="size-3 mr-1" /> Overdue
                      </span>
                    )}
                    {fup.status === "completed" && (
                      <span className="inline-flex items-center text-xs font-medium bg-success/10 text-success px-2 py-0.5 rounded ml-2">
                        <CheckCircle2 className="size-3 mr-1" /> Completed
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{fup.task}</p>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Clock className="size-4" /> Due: {format(new Date(fup.dueAt), "PPP")}
                  </div>
                </div>
                <div>
                  {fup.status === "pending" && (
                    <Button 
                      onClick={() => completeMutation.mutate(fup.id)}
                      disabled={completeMutation.isPending}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {fup.status === "completed" && (
                    <div className="text-sm text-muted-foreground">
                      Completed {format(new Date(fup.completedAt), "PPP")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
