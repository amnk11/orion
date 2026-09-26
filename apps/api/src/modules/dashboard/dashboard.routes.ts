import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { dashboardService } from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/**
 * GET /api/v1/dashboard/summary
 * Returns supervisor operations metrics
 */
dashboardRouter.get("/summary", requireRole("supervisor", "admin"), async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const summary = await dashboardService.getSummary(facilityId);
    res.json({ ok: true, data: summary });
  } catch (error) {
    next(error);
  }
});
