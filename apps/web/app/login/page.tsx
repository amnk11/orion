"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "~/lib/auth/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Spinner } from "~/components/ui/spinner";
import type { UserRole } from "@orion/shared";

interface DemoAccount {
  label: string;
  role: UserRole;
  email: string;
  facility: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Origin (CHO)",
    role: "origin",
    email: "cho.rampur@orion.local",
    facility: "AAM Rampur",
  },
  {
    label: "Destination (Desk)",
    role: "destination",
    email: "desk.chcpurnia@orion.local",
    facility: "CHC Purnia",
  },
  {
    label: "Supervisor (DHO)",
    role: "supervisor",
    email: "supervisor.purnia@orion.local",
    facility: "District Hospital Purnia",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRoleRedirect = (role?: string) => {
    switch (role) {
      case "destination":
        router.push("/inbox");
        break;
      case "supervisor":
        router.push("/supervisor");
        break;
      case "origin":
      default:
        router.push("/app");
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Invalid credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      // Check user role from returned user record
      const user = res.data?.user as { role?: string } | undefined;
      handleRoleRedirect(user?.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to authentication server.";
      setError(message);
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword("OrionDemoPass123!");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-md shadow-blue-500/20">
            OR
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Orion Referral Network
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure Staff Authentication & Handoff Management
          </p>
        </div>

        <Card className="border-slate-200/80 shadow-lg dark:border-slate-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your facility</CardTitle>
            <CardDescription>
              Enter your registered staff email and password below
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Staff Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@orion.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" /> Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Demo Mode Quick Login Buttons */}
              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                  Quick Demo Access (SIH Development)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickDemoLogin(acc)}
                      className="px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors text-center truncate"
                      title={`${acc.label}: ${acc.facility}`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-xs text-center text-slate-400">
          Orion Closed-Loop Referral System • Confidential Health Worker Portal
        </p>
      </div>
    </div>
  );
}
