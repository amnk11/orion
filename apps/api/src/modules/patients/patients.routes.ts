import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { patientsService } from "./patients.service";
import { z } from "zod";

export const patientsRouter = Router();

// Zod schema for patient creation
const createPatientSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  age: z.number().int().min(0).max(150).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
});

// All routes require authentication
patientsRouter.use(requireAuth);

/**
 * GET /api/v1/patients
 * Retrieves facility-scoped patients.
 */
patientsRouter.get("/", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: "User is not assigned to a facility" },
      });
    }

    const patientList = await patientsService.getPatientsByFacility(facilityId);
    res.json({ ok: true, data: patientList });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/patients
 * Only origin users can create patients.
 */
patientsRouter.post("/", requireRole("origin"), async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: "User is not assigned to a facility" },
      });
    }

    const parseResult = createPatientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid patient data",
          details: parseResult.error.issues,
        },
      });
    }

    const patient = await patientsService.createPatient(facilityId, parseResult.data);
    res.status(201).json({ ok: true, data: patient });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/patients/:id
 * Retrieve a single patient by ID, strictly scoped to facility.
 */
patientsRouter.get("/:id", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: "User is not assigned to a facility" },
      });
    }

    const { id } = req.params;
    const patient = await patientsService.getPatientByIdAndFacility(id, facilityId);

    if (!patient) {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Patient not found or unauthorized" },
      });
    }

    res.json({ ok: true, data: patient });
  } catch (error) {
    next(error);
  }
});
