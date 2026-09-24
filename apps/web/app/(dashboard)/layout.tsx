"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "~/lib/auth/auth-client";
import { useSessionUser } from "~/hooks/use-session-user";
import Link from "next/link";
import { FilePlus2, Inbox, LogOut, Loader2, Menu, LayoutDashboard, ClipboardCheck, ListChecks } from "lucide-react";
import { cn } from "~/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "~/components/ui/sheet";
import { OfflineBanner } from "~/components/offline/offline-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isPending, isOrigin, isDestination, isSupervisor, isAdmin } = useSessionUser();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!user) {
        router.replace("/login");
        return;
      }
      
      if (pathname === "/") {
        if (isDestination) router.replace("/destination");
        else if (isSupervisor) router.replace("/supervisor");
        else if (isOrigin) router.replace("/app");
        else if (isAdmin) router.replace("/app");
        else router.replace("/login");
        return;
      }

      if (pathname.startsWith("/app") && !isOrigin && !isAdmin) {
        if (isDestination) router.replace("/destination");
        else if (isSupervisor) router.replace("/supervisor");
        else router.replace("/");
      } else if (pathname.startsWith("/destination") && !isDestination && !isAdmin) {
        if (isOrigin) router.replace("/app");
        else if (isSupervisor) router.replace("/supervisor");
        else router.replace("/");
      } else if (pathname.startsWith("/supervisor") && !isSupervisor && !isAdmin) {
        if (isOrigin) router.replace("/app");
        else if (isDestination) router.replace("/destination");
        else router.replace("/");
      }
    }
  }, [user, isPending, router, pathname, isDestination, isSupervisor, isOrigin, isAdmin]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isPending || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    try {
      const { db } = await import("~/lib/offline/db");
      await db.delete();
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/login";
  };

  const NavItem = ({ href, icon: Icon, children, exact = false }: { href: string; icon: any; children: React.ReactNode; exact?: boolean }) => {
    const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(`${href}/`));
    
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive 
            ? "bg-sidebar-primary/10 text-sidebar-primary" 
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="size-4" />
        {children}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-start px-4 border-b border-border shrink-0">
        <Link href="/app" className="flex items-center gap-2.5 w-full hover:opacity-90 transition-opacity">
          <Image src="/sahay-small.svg" alt="Sahay Logo" width={28} height={28} className="rounded-sm object-left" />
          <span className="font-bold text-xl tracking-tight text-primary">Sahay</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {/* Origin Only */}
        {isOrigin && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Origin Desk</div>
            <NavItem href="/app" icon={Inbox} exact>My Referrals</NavItem>
            <NavItem href="/app/new/patient" icon={FilePlus2}>New Referral</NavItem>
            <NavItem href="/app/follow-ups" icon={ListChecks}>Follow-ups</NavItem>
          </>
        )}

        {/* Destination Only */}
        {isDestination && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Destination Desk</div>
            <NavItem href="/destination" icon={Inbox} exact>Incoming Referrals</NavItem>
            <NavItem href="/destination/capabilities" icon={ClipboardCheck}>Capabilities</NavItem>
          </>
        )}

        {/* Supervisor Only */}
        {isSupervisor && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Supervisor</div>
            <NavItem href="/supervisor" icon={LayoutDashboard}>Analytics</NavItem>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="text-sm font-medium text-sidebar-foreground truncate">
          {user.name}
        </div>
        <div className="text-xs text-muted-foreground truncate mb-4">
          {user.email}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <Image src="/sahay-small.svg" alt="Sahay Logo" height={32} width={100} className="h-8 w-auto object-contain" />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="size-11 inline-flex items-center justify-center -mr-2 text-sidebar-foreground" aria-label="Toggle navigation menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-sidebar-border flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar flex-col">
        <SidebarContent />
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0 bg-background relative z-0">
        <OfflineBanner />
        <div className="flex-1 overflow-y-auto w-full max-w-[100vw]">
          {children}
        </div>
      </main>
    </div>
  );
}
