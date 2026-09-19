import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { handoffsService } from "./handoffs.service";
import { z } from "zod";

export const handoffsRouter = Router();

const createHandoffSchema = z.object({
  patientId: z.string().uuid(),
  protocolCode: z.string(),
  destinationFacilityId: z.string().uuid(),
  packetJson: z.record(z.string(), z.any()),
  idempotencyKey: z.string().min(1),
});

handoffsRouter.use(requireAuth);

/**
 * GET /api/v1/handoffs
 * Returns facility-scoped list of handoffs
 */
handoffsRouter.get("/", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const list = await handoffsService.getHandoffsByFacility(facilityId);
    res.json({ ok: true, data: list });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/handoffs/:id
 * Returns handoff detail and timeline events
 */
handoffsRouter.get("/:id", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const detail = await handoffsService.getHandoffDetail(req.params.id, facilityId);
    if (!detail) {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Handoff not found" } });
    }

    res.json({ ok: true, data: detail });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/handoffs
 * Origin user creates a handoff
 */
handoffsRouter.post("/", requireRole("origin"), async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const parseResult = createHandoffSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ ok: false, error: { code: "VALIDATION_ERROR", details: parseResult.error.issues } });
    }

    try {
      const { handoff, isDuplicate } = await handoffsService.createHandoff({
        ...parseResult.data,
        originFacilityId: facilityId,
        userId: req.userId!,
      });

      res.status(isDuplicate ? 200 : 201).json({ ok: true, data: handoff });
    } catch (e: unknown) {
      const err = e as Error;
      if (err.message === "IDEMPOTENCY_CONFLICT") {
        return res.status(409).json({ ok: false, error: { code: "CONFLICT", message: "Idempotency key reused with different payload" } });
      }
      if (err.message === "INVALID_PROTOCOL" || err.message === "INCOMPLETE_PROTOCOL") {
        return res.status(400).json({ ok: false, error: { code: "BAD_REQUEST", message: err.message } });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
});
