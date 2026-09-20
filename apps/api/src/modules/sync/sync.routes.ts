import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { syncService } from "./sync.service";
import { z } from "zod";

export const syncRouter = Router();

const batchSyncSchema = z.object({
  mutations: z.array(
    z.object({
      clientMutationId: z.string(),
      mutationType: z.enum(["create_handoff", "create_patient"]),
      payload: z.any(),
    })
  ),
});

syncRouter.use(requireAuth);

/**
 * POST /api/v1/sync/batch
 * Process offline mutations
 */
syncRouter.post("/batch", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    const userId = req.userId;

    if (!facilityId || !userId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "User is not assigned to a facility" } });
    }

    const parseResult = batchSyncSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid payload" } });
    }

    const results = await syncService.processBatch(facilityId, userId as string, parseResult.data.mutations);

    res.json({ ok: true, data: { results } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/sync/pull
 * Fetch any needed references or sync state
 */
syncRouter.get("/pull", async (req, res, next) => {
  try {
    // Phase 7 minimal pull if needed
    res.json({ ok: true, data: {} });
  } catch (error) {
    next(error);
  }
});
