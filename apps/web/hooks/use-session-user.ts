import { useSession } from "~/lib/auth/auth-client";
import { UserRole } from "@orion/shared";
import { useEffect, useState } from "react";

/** How long a cached session stays trusted when the network is unavailable (8 hours). */
const SESSION_CACHE_TTL_MS = 8 * 60 * 60 * 1000;

/** Shape of the active user exposed to consumers of this hook. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
  [key: string]: unknown;
}

interface CachedSession {
  user: SessionUser;
  cachedAt: number;
}

/** Safely read and parse the cached session from localStorage. Returns null on any failure. */
function readCache(): CachedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("orion-session-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    // BUG-07 FIX: Honour the TTL — a stale cache entry is not trusted.
    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > SESSION_CACHE_TTL_MS) {
      localStorage.removeItem("orion-session-user");
      return null;
    }
    return parsed;
  } catch (e) {
    // BUG-15 FIX: Log corrupt cache entries and evict them instead of silently swallowing.
    console.warn("[orion] Corrupt session cache — clearing.", e);
    localStorage.removeItem("orion-session-user");
    return null;
  }
}

export function useSessionUser() {
  const { data, isPending, error } = useSession();
  // BUG-07 FIX: Type the cached user properly instead of `any`.
  const [cachedUser, setCachedUser] = useState<SessionUser | null>(null);

  // Initial load from cache — runs once on mount to prevent offline flashes.
  useEffect(() => {
    const cached = readCache();
    if (cached) setCachedUser(cached.user);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (data?.user) {
      // Fresh session — persist with a fresh timestamp.
      const user = data.user as unknown as SessionUser;
      const entry: CachedSession = { user, cachedAt: Date.now() };
      localStorage.setItem("orion-session-user", JSON.stringify(entry));
      setCachedUser(user);
    } else if (!isPending && !error) {
      // Legitimate logout — remove cached session.
      localStorage.removeItem("orion-session-user");
      setCachedUser(null);
    } else if (!data?.user && error) {
      // Network error / offline — use cache if still within TTL.
      // BUG-07 FIX: The TTL check happens inside readCache().
      const cached = readCache();
      if (cached) setCachedUser(cached.user);
    }
  }, [data?.user, isPending, error]);

  const activeUser: SessionUser | null =
    (data?.user as unknown as SessionUser | undefined) ?? cachedUser;

  const role = activeUser?.role as UserRole | undefined;

  const isOrigin = role === "origin";
  const isDestination = role === "destination";
  const isSupervisor = role === "supervisor";
  const isAdmin = role === "admin";

  const hasFacility = !!activeUser?.facilityId;

  // If we have a cached user, we are no longer effectively pending for layout purposes.
  const effectivelyPending = isPending && !activeUser;

  return {
    user: activeUser,
    session: data?.session,
    isPending: effectivelyPending,
    error,
    role,
    isOrigin,
    isDestination,
    isSupervisor,
    isAdmin,
    hasFacility,
  };
}
