import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { facilitiesService } from "./facilities.service";

export const facilitiesRouter = Router();

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
