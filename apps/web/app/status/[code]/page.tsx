import * as React from "react";
import { notFound } from "next/navigation";
import { Activity, Clock, MapPin, ShieldAlert } from "lucide-react";
import { StatusBadge } from "~/components/ui/status-badge";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface PublicStatusData {
  publicCode: string;
  state: string;
  urgency: string;
  updatedAt: string;
  destinationName: string | null;
}

async function getStatus(code: string): Promise<PublicStatusData | null> {
  // Try calling the API directly
  // Using absolute URL isn't required if we fetch directly from DB in RSC, 
  // but to maintain boundary we'll use a fetch or direct DB query.
  // The easiest way in a Server Component is to just hit the DB if we can,
  // but let's just fetch the API.
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/v1/public/status/${code}`, {
      next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default async function PublicStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  const data = await getStatus(code);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border text-center space-y-4">
          <ShieldAlert className="size-12 text-muted-foreground mx-auto opacity-50" />
          <h1 className="text-xl font-semibold">Referral Status Unavailable</h1>
          <p className="text-muted-foreground text-sm">
            This referral code is invalid, expired, or unavailable. No patient information can be displayed.
          </p>
        </div>
      </div>
    );
  }

  // Derive next steps safely
  let nextStep = "Wait for further instructions.";
  if (data.state === "accepted") {
    nextStep = `Proceed to ${data.destinationName}.`;
  } else if (data.state === "redirected") {
    nextStep = `Referral redirected. Proceed to ${data.destinationName}.`;
  } else if (data.state === "arrived") {
    nextStep = "Patient has arrived at destination.";
  } else if (data.state === "outcome_recorded" || data.state === "closed") {
    nextStep = "Referral loop completed.";
  } else if (data.state === "sent" || data.state === "acknowledged") {
    nextStep = "Pending acceptance by destination.";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b text-center space-y-2">
          <Activity className="size-8 text-primary mx-auto" />
          <h1 className="text-xl font-bold tracking-tight">Referral Status</h1>
          <div className="font-mono text-sm text-muted-foreground bg-white px-2 py-1 rounded inline-block border">
            {data.publicCode}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="size-4" /> Current State
            </p>
            <div>
              <StatusBadge state={data.state} />
            </div>
          </div>

          {data.destinationName && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4" /> Destination
              </p>
              <p className="font-medium">{data.destinationName}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Action Required</p>
            <div className="p-3 bg-blue-50 text-blue-900 rounded-md text-sm font-medium border border-blue-100">
              {nextStep}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="size-3" />
          Updated {formatDistanceToNow(new Date(data.updatedAt))} ago
        </div>

      </div>

      <p className="mt-8 text-xs text-muted-foreground max-w-md text-center">
        This page provides operational status only. For privacy reasons, clinical details and patient identifiers are not displayed.
      </p>
    </div>
  );
}
