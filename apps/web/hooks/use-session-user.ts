import { useSession } from "~/lib/auth/auth-client";
import { UserRole } from "@orion/shared";

export function useSessionUser() {
  const { data, isPending, error } = useSession();

  const user = data?.user as any;
  const role = user?.role as UserRole | undefined;

  const isOrigin = role === "origin";
  const isDestination = role === "destination";
  const isSupervisor = role === "supervisor";
  const isAdmin = role === "admin";

  const hasFacility = !!user?.facilityId;

  return {
    user,
    session: data?.session,
    isPending,
    error,
    role,
    isOrigin,
    isDestination,
    isSupervisor,
    isAdmin,
    hasFacility,
    // Add permission helpers here in the future
  };
}
