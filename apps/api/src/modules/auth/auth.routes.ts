import { Router } from "express";
import { requireAuth, requireRole } from "./auth.middleware";

export const authRouter = Router();

// GET /api/v1/auth/me - returns authenticated user context
authRouter.get("/me", requireAuth, (req, res) => {
  const user = req.user!;
  res.status(200).json({
    ok: true,
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
    },
  });
});

// GET /api/v1/auth/origin-test - verifies role guard for origin role
authRouter.get("/origin-test", requireAuth, requireRole("origin"), (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Origin access granted",
  });
});

// GET /api/v1/auth/destination-test - verifies role guard for destination role
authRouter.get(
  "/destination-test",
  requireAuth,
  requireRole("destination"),
  (_req, res) => {
    res.status(200).json({
      ok: true,
      message: "Destination access granted",
    });
  }
);

// GET /api/v1/auth/supervisor-test - verifies role guard for supervisor role
authRouter.get(
  "/supervisor-test",
  requireAuth,
  requireRole("supervisor"),
  (_req, res) => {
    res.status(200).json({
      ok: true,
      message: "Supervisor access granted",
    });
  }
);
