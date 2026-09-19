"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "~/lib/auth/auth-client";
import { useSessionUser } from "~/hooks/use-session-user";
import Link from "next/link";
import { FilePlus2, Inbox, LogOut, Loader2, Menu, X } from "lucide-react";

export default function OriginDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isPending, role, isOrigin, isDestination, isSupervisor } = useSessionUser();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!user) {
        router.replace("/login");
        return;
      }
      
      if (isDestination) {
        router.replace("/inbox");
      } else if (isSupervisor) {
        router.replace("/supervisor");
      } else if (!isOrigin) {
        router.replace("/login");
      }
    }
  }, [user, isPending, router, isOrigin, isDestination, isSupervisor]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  if (isPending || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4">
        <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
          Orion / Origin Desk
        </span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-slate-600 dark:text-slate-300">
          <Menu className="size-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-14 hidden md:flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
            Orion / Origin Desk
          </span>
        </div>
        <div className="h-14 md:hidden flex items-center px-4 border-b border-slate-200 dark:border-slate-800 justify-between">
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
            Menu
          </span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-600 dark:text-slate-300">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <Link
            href="/app"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:bg-slate-800 dark:hover:text-white"
          >
            <Inbox className="size-4" />
            My Referrals
          </Link>
          <Link
            href="/app/new/patient"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
          >
            <FilePlus2 className="size-4" />
            New Referral
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {user.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mb-4">
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
