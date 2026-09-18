import { type RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth";
import type { UserRole } from "@orion/shared";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
      role?: UserRole;
      facilityId?: string;
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please sign in.",
        },
      });
    }

    const rawUser = session.user as Record<string, unknown>;
    const userRole = (rawUser.role as UserRole) || "origin";

    const authenticatedUser: AuthenticatedUser = {
      id: String(rawUser.id),
      name: String(rawUser.name),
      email: String(rawUser.email),
      role: userRole,
      facilityId: rawUser.facilityId ? String(rawUser.facilityId) : null,
    };

    req.user = authenticatedUser;
    req.userId = authenticatedUser.id;
    req.role = authenticatedUser.role;
    if (authenticatedUser.facilityId) {
      req.facilityId = authenticatedUser.facilityId;
    }

    next();
  } catch {
    return res.status(401).json({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired session.",
      },
    });
  }
};

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: `Insufficient role permissions. Required one of: ${allowedRoles.join(", ")}`,
        },
      });
    }
    next();
  };
}
