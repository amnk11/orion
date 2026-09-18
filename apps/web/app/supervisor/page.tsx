"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "~/lib/auth/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Spinner } from "~/components/ui/spinner";

export default function SupervisorDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex items-center gap-3 text-slate-500">
          <Spinner className="size-5" />
          <span>Verifying session...</span>
        </div>
      </main>
    );
  }

  const user = session?.user as {
    name?: string;
    email?: string;
    role?: string;
    facilityId?: string;
  } | undefined;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
      <Card className="max-w-lg w-full shadow-lg border-slate-200/80 dark:border-slate-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Supervisor Oversight
            </Badge>
            {user?.role && (
              <Badge className="bg-amber-600 text-white capitalize">
                Role: {user.role}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl pt-2">District Oversight Portal</CardTitle>
          <CardDescription>
            District Health Officer &amp; Monitoring Dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {session ? (
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 space-y-2 border border-slate-200/60 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Active Staff Session
              </h3>
              <div className="text-sm grid grid-cols-[100px_1fr] gap-1 text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-400">Name:</span>
                <span>{user?.name || "Supervisor"}</span>

                <span className="font-medium text-slate-400">Email:</span>
                <span>{user?.email}</span>

                <span className="font-medium text-slate-400">Role:</span>
                <span className="capitalize">{user?.role}</span>

                <span className="font-medium text-slate-400">Facility ID:</span>
                <span className="font-mono text-xs truncate">{user?.facilityId || "None"}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please sign in to access supervisor oversight.
              </p>
              <Link href="/login">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">Go to Login</Button>
              </Link>
            </div>
          )}

          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
            📌 <strong>Phase 1 Landing Verification</strong>: Redirect to supervisor oversight succeeded. District-wide metrics, aging referrals, and capability audits will be implemented in Phase 11.
          </div>
        </CardContent>

        {session && (
          <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-xs text-slate-400">Authenticated with Better Auth</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
