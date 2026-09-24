import { useSession } from "~/lib/auth/auth-client";
import { UserRole } from "@orion/shared";
import { useEffect, useState } from "react";

export function useSessionUser() {
  const { data, isPending, error } = useSession();
  const [cachedUser, setCachedUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (data?.user) {
        localStorage.setItem("orion-session-user", JSON.stringify(data.user));
        setCachedUser(data.user);
      } else if (!isPending && !error) {
        // Legitimate logout
        localStorage.removeItem("orion-session-user");
        setCachedUser(null);
      } else if (!data?.user && error) {
        // Network error/offline - try to load from cache
        try {
          const cached = localStorage.getItem("orion-session-user");
          if (cached) setCachedUser(JSON.parse(cached));
        } catch (e) {}
      }
    }
  }, [data?.user, isPending, error]);

  // Initial load from cache to prevent hydration mismatch and offline flashes
  useEffect(() => {
    if (typeof window !== "undefined" && !cachedUser) {
      try {
        const cached = localStorage.getItem("orion-session-user");
        if (cached) setCachedUser(JSON.parse(cached));
      } catch (e) {}
    }
  }, []);

  const activeUser = data?.user || cachedUser;
  const role = activeUser?.role as UserRole | undefined;

  const isOrigin = role === "origin";
  const isDestination = role === "destination";
  const isSupervisor = role === "supervisor";
  const isAdmin = role === "admin";

  const hasFacility = !!activeUser?.facilityId;

  // If we have a cached user, we can consider ourselves no longer pending for layout purposes
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
