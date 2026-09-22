import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware";
import { canAttestCapability } from "../auth/scope";
import { facilitiesService } from "../facilities/facilities.service";
import { CAPABILITY_STATUSES } from "@orion/domain";

export const capabilitiesRouter = Router();

// All routes require authentication
capabilitiesRouter.use(requireAuth);

/**
 * Phase 8: re-attestation payload for an existing snapshot.
 */
const updateCapabilitySchema = z.object({
  status: z.enum(CAPABILITY_STATUSES),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

/**
 * PUT /api/v1/capabilities/:id
 * Re-attests an existing capability snapshot (updates status/note and
 * resets attestedAt to now).
 *
 * Authorization matches POST /facilities/:id/capabilities: destination and
 * supervisor users only for their own facility, admin anywhere, origin never.
 */
capabilitiesRouter.put("/:id", async (req, res, next) => {
  try {
    const existing = await facilitiesService.getCapabilityById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Capability snapshot not found" },
      });
    }

    if (!canAttestCapability(req.user!, existing.facilityId)) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "You are not allowed to attest capabilities for this facility",
        },
      });
    }

    const parseResult = updateCapabilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", details: parseResult.error.issues },
      });
    }

    const snapshot = await facilitiesService.updateCapabilityById(existing.id, {
      status: parseResult.data.status,
      note: parseResult.data.note,
      attestedBy: req.userId!,
    });

    res.status(200).json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
});
