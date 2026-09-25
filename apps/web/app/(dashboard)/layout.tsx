"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "~/lib/auth/auth-client";
import { useSessionUser } from "~/hooks/use-session-user";
import Link from "next/link";
import { FilePlus2, Inbox, LogOut, Loader2, Menu, LayoutDashboard, ClipboardCheck, ListChecks, User } from "lucide-react";
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const type = (target as HTMLInputElement).type;
        if (type !== 'checkbox' && type !== 'radio' && type !== 'submit' && type !== 'button') {
          setIsKeyboardVisible(true);
        }
      }
    };
    const handleBlur = () => {
      setIsKeyboardVisible(false);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

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
    await signOut(); if (typeof window !== "undefined") localStorage.removeItem("orion-session-user");
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

  const BottomNavItem = ({ href, icon: Icon, label, exact = false }: { href: string; icon: any; label: string; exact?: boolean }) => {
    const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(`${href}/`));
    
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center justify-center w-16 gap-1 flex-1 py-1 transition-colors",
          isActive 
            ? "text-primary" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className={cn("flex items-center justify-center size-8 rounded-full transition-colors", isActive && "bg-primary/10")}>
          <Icon className="size-5" />
        </div>
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
      </Link>
    );
  };

  const MobileBottomNav = () => {
    if (isKeyboardVisible) return null;

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1">
          {isOrigin && (
            <>
              <BottomNavItem href="/app" icon={Inbox} label="Referrals" exact />
              <BottomNavItem href="/app/new/patient" icon={FilePlus2} label="New" />
              <BottomNavItem href="/app/follow-ups" icon={ListChecks} label="Follow-ups" />
            </>
          )}
          
          {isDestination && (
            <>
              <BottomNavItem href="/destination" icon={Inbox} label="Referrals" exact />
              <BottomNavItem href="/destination/capabilities" icon={ClipboardCheck} label="Capabilities" />
            </>
          )}

          {isSupervisor && (
            <>
              <BottomNavItem href="/supervisor" icon={LayoutDashboard} label="Analytics" />
            </>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className={cn(
                "flex flex-col items-center justify-center w-16 gap-1 flex-1 py-1 transition-colors outline-none",
                isMobileMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <div className={cn("flex items-center justify-center size-8 rounded-full transition-colors", isMobileMenuOpen && "bg-primary/10")}>
                  <Menu className="size-5" />
                </div>
                <span className="text-[10px] font-medium tracking-wide">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0 rounded-t-2xl max-h-[85vh] flex flex-col gap-0 border-t border-border bg-background">
              <SheetTitle className="sr-only">More Options</SheetTitle>
              <div className="p-4 border-b border-border bg-muted/30 flex flex-col items-center justify-center text-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <User className="size-7 text-primary" />
                </div>
                <div className="text-base font-semibold text-foreground truncate w-full px-4">
                  {user.name}
                </div>
                <div className="text-sm text-muted-foreground truncate w-full px-4">
                  {user.email}
                </div>
                <div className="mt-3 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full">
                  {isAdmin ? "Admin" : isOrigin ? "Origin Desk" : isDestination ? "Destination Desk" : "Supervisor"}
                </div>
              </div>
              <div className="p-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-4 text-sm font-medium rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-5" />
                  Sign out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <Link href="/app" className="hover:opacity-90 transition-opacity">
          <Image src="/sahay-small.svg" alt="Sahay Logo" height={32} width={100} className="h-8 w-auto object-contain" />
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar flex-col">
        <SidebarContent />
      </aside>
      
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden pt-14 md:pt-0 bg-background relative z-0 transition-all duration-200 ease-in-out",
        !isKeyboardVisible ? "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0" : "pb-0"
      )}>
        <OfflineBanner />
        <div className="flex-1 overflow-y-auto w-full max-w-[100vw]">
          {children}
        </div>
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
