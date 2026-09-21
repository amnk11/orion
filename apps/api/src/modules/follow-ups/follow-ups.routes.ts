import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { followUpsService } from "./follow-ups.service";

export const followUpsRouter = Router();

followUpsRouter.use(requireAuth);

/**
 * GET /api/v1/follow-ups?status=
 * List follow-ups for the responsible facility.
 */
followUpsRouter.get("/", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const status = req.query.status as string | undefined;
    const list = await followUpsService.getFollowUpsByFacility(facilityId, status);
    res.json({ ok: true, data: list });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/follow-ups/:id/complete
 * Complete a follow-up task.
 */
followUpsRouter.post("/:id/complete", requireRole("origin"), async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    try {
      if (!req.userId) throw new Error("UNAUTHORIZED");
      const userIdStr = req.userId as string;
      const clientEventId = req.body?.clientEventId ? String(req.body.clientEventId) : undefined;
      const { followUp, isDuplicate } = clientEventId 
        ? await followUpsService.completeFollowUp(req.params.id as string, facilityId, userIdStr, clientEventId)
        : await followUpsService.completeFollowUp(req.params.id as string, facilityId, userIdStr);
      res.status(isDuplicate ? 200 : 201).json({ ok: true, data: followUp });
    } catch (e: any) {
      if (e.message === "NOT_FOUND") {
        return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Follow-up not found or unauthorized" } });
      }
      if (e.message === "INVALID_STATE") {
        return res.status(409).json({ ok: false, error: { code: "CONFLICT", message: "Follow-up already completed or not pending" } });
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
});
