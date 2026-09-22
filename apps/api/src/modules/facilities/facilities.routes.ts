import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware";
import { canAttestCapability } from "../auth/scope";
import { facilitiesService } from "./facilities.service";
import { CAPABILITY_SERVICE_CODES, CAPABILITY_STATUSES } from "@orion/domain";

export const facilitiesRouter = Router();

/**
 * Phase 8: capability attestation payload.
 * Status uses the business contract (AVAILABLE | UNAVAILABLE | UNKNOWN);
 * the service maps it to the storage-level representation.
 */
export const attestCapabilitySchema = z.object({
  serviceCode: z.enum(CAPABILITY_SERVICE_CODES),
  status: z.enum(CAPABILITY_STATUSES),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

// All routes require authentication
facilitiesRouter.use(requireAuth);

/**
 * GET /api/v1/facilities
 * Retrieves all facilities for the destination selector.
 */
facilitiesRouter.get("/", async (req, res, next) => {
  try {
    const list = await facilitiesService.getFacilities();
    res.json({ ok: true, data: list });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/facilities/:id
 * Retrieve a single facility.
 */
facilitiesRouter.get("/:id", async (req, res, next) => {
  try {
    const facility = await facilitiesService.getFacilityById(req.params.id);
    if (!facility) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Facility not found" },
      });
    }
    res.json({ ok: true, data: facility });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/facilities/:id/capabilities
 * Retrieves the latest capabilities for the given facility.
 */
facilitiesRouter.get("/:id/capabilities", async (req, res, next) => {
  try {
    const facility = await facilitiesService.getFacilityById(req.params.id);
    if (!facility) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Facility not found" },
      });
    }

    const caps = await facilitiesService.getCapabilitiesByFacility(req.params.id);
    res.json({ ok: true, data: caps });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/facilities/:id/capabilities
 * Attests (creates or refreshes) the capability snapshot for a service.
 *
 * Authorization (Phase 8):
 * - destination users: only their own facility
 * - supervisors: only their assigned facility
 * - admin: any facility
 * - origin/CHO: never
 */
facilitiesRouter.post("/:id/capabilities", async (req, res, next) => {
  try {
    const facility = await facilitiesService.getFacilityById(req.params.id);
    if (!facility) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Facility not found" },
      });
    }

    if (!canAttestCapability(req.user!, facility.id)) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "You are not allowed to attest capabilities for this facility",
        },
      });
    }

    const parseResult = attestCapabilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", details: parseResult.error.issues },
      });
    }

    const snapshot = await facilitiesService.attestCapability({
      facilityId: facility.id,
      serviceCode: parseResult.data.serviceCode,
      status: parseResult.data.status,
      note: parseResult.data.note,
      attestedBy: req.userId!,
    });

    res.status(200).json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
});
