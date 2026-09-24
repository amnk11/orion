"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "~/lib/auth/auth-client";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Spinner } from "~/components/ui/spinner";
import { Activity } from "lucide-react";
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
    email: "cho.wadgaon@sahay.demo",
    facility: "AAM Wadgaon",
  },
  {
    label: "Destination (Desk)",
    role: "destination",
    email: "desk.rajgurunagar@sahay.demo",
    facility: "CHC Rajgurunagar",
  },
  {
    label: "Supervisor",
    role: "supervisor",
    email: "supervisor.pune@sahay.demo",
    facility: "DH Pune",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: sessionData, isPending: sessionPending } = useSession();

  const handleRoleRedirect = (role?: string) => {
    switch (role) {
      case "destination":
        router.push("/destination");
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

  React.useEffect(() => {
    if (!sessionPending && sessionData?.user) {
      const user = sessionData.user as { role?: string };
      handleRoleRedirect(user.role);
    }
  }, [sessionData, sessionPending, router]);

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
        setError(res.error.message || "Invalid credentials. Please verify and try again.");
        setLoading(false);
        return;
      }

      const user = res.data?.user as { role?: string } | undefined;
      handleRoleRedirect(user?.role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication server is unreachable.";
      setError(message);
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword("SahayDemoPass123!");
    setError(null);
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row bg-background">
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-surface-inset border-r border-border p-12">
        <div className="flex items-center gap-3">
          <Image src="/sahay-small.svg" alt="Sahay Logo" height={40} width={133} />
        </div>
        
        <div className="space-y-6 max-w-lg">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground">
            Coordinated Clinical Operations
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Sahay connects primary care facilities with district hospitals to ensure timely, safe, and transparent patient referrals across the healthcare network.
          </p>
        </div>
        
        <div className="text-sm font-medium text-muted-foreground">
          &copy; {new Date().getFullYear()} Sahay Health Systems. All rights reserved.
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-[380px] space-y-10">
          
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden flex-col items-center text-center space-y-4 mb-8">
            <Image src="/sahay-small.svg" alt="Sahay Logo" height={48} width={160} />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Clinical Operations & Referral Network
              </p>
            </div>
          </div>

          <div className="space-y-2 hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your staff credentials to access the secure network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-3">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Staff Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@sahay.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 bg-background"
                  aria-invalid={!!error}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 bg-background"
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" /> Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Development Utility */}
            {process.env.NODE_ENV === "development" && (
              <div className="pt-8 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Dev Utility
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickDemoLogin(acc)}
                      className="flex min-h-[44px] items-center justify-between rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground hover:border-ring"
                    >
                      <span>{acc.label}</span>
                      <span className="font-mono text-xs opacity-70">{acc.facility}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
