import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { handoffsService } from "./handoffs.service";
import { assertPartyToHandoff } from "../auth/scope";
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
      return res
        .status(403)
        .json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const roleParam = req.query.role as string | undefined;

    // Optional constraint: if they request role=inbound, we can ensure they are actually a destination user.
    // The instructions say "Actual authorization must come from the authenticated session".
    if (roleParam === "inbound" && req.role !== "destination") {
      return res
        .status(403)
        .json({ ok: false, error: { code: "FORBIDDEN", message: "Only destination users can view inbound handoffs" } });
    }

    const list = await handoffsService.getHandoffsByFacility(facilityId, roleParam);
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
    try {
      await assertPartyToHandoff(req.user!, req.params.id);
    } catch (e: any) {
      if (e.message === "NOT_PARTY_TO_HANDOFF") {
        return res
          .status(404)
          .json({ ok: false, error: { code: "NOT_FOUND", message: "Handoff not found" } });
      }
      return res
        .status(403)
        .json({
          ok: false,
          error: { code: "FORBIDDEN", message: "User is not assigned to a facility" },
        });
    }

    // Passing admin/supervisor role or null facilityId if we allowed them
    const detail = await handoffsService.getHandoffDetail(req.params.id);
    if (!detail) {
      return res
        .status(404)
        .json({ ok: false, error: { code: "NOT_FOUND", message: "Handoff not found" } });
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
      return res
        .status(403)
        .json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    const parseResult = createHandoffSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({
          ok: false,
          error: { code: "VALIDATION_ERROR", details: parseResult.error.issues },
        });
    }

    try {
      const { handoff, isDuplicate } = await handoffsService.createHandoff({
        ...parseResult.data,
        originFacilityId: facilityId,
        userId: req.userId!,
      });

      res.status(isDuplicate ? 200 : 201).json({ ok: true, data: handoff });
    } catch (e: any) {
      if (e.message === "IDEMPOTENCY_CONFLICT") {
        return res
          .status(409)
          .json({
            ok: false,
            error: { code: "CONFLICT", message: "Idempotency key reused with different payload" },
          });
      }
      if (e.message === "INVALID_PROTOCOL" || e.message === "INCOMPLETE_PROTOCOL") {
        return res
          .status(400)
          .json({
            ok: false,
            error: { code: "BAD_REQUEST", message: e.message, missingFields: e.missingFields },
          });
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
});

import { handoffsTransitions, TransitionError } from "./handoffs.transitions";
import {
  cannotAcceptSchema,
  redirectSchema,
  baseTransitionSchema,
  outcomeSchema,
} from "./handoffs.schemas";
import { HandoffState } from "@orion/domain";

const handleTransition = (targetState: HandoffState, schema?: z.ZodSchema) => {
  return async (req: any, res: any, next: any) => {
    try {
      const facilityId = req.facilityId;
      if (!facilityId) {
        return res
          .status(403)
          .json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
      }

      let payload = req.body;
      let reason: string | undefined;
      let clientEventId = req.body?.clientEventId;

      if (schema) {
        const parseResult = schema.safeParse(req.body);
        if (!parseResult.success) {
          return res
            .status(400)
            .json({
              ok: false,
              error: { code: "VALIDATION_ERROR", details: parseResult.error.issues },
            });
        }
        payload = parseResult.data;
        reason = payload.reason;
        clientEventId = payload.clientEventId;
      }

      let mutationFn = undefined;

      if (targetState === "redirected") {
        if (payload.destinationFacilityId === req.facilityId) {
          return res
            .status(400)
            .json({
              ok: false,
              error: { code: "BAD_REQUEST", message: "Cannot redirect to current destination" },
            });
        }
        mutationFn = async (handoff: any) => {
          if (handoff.redirectCount >= 3) {
            throw new Error("REDIRECT_LIMIT_REACHED");
          }
          if (payload.destinationFacilityId === handoff.currentDestinationFacilityId) {
            throw new Error("REDIRECT_SAME_DESTINATION");
          }
          return {
            currentDestinationFacilityId: payload.destinationFacilityId,
            redirectCount: handoff.redirectCount + 1,
            redirectReason: reason,
          };
        };
      }

      if (targetState === "outcome_recorded") {
        mutationFn = async (handoff: any, tx: any) => {
          // In a real implementation we would insert into outcomes table here.
          // For phase 4 we just ensure the state transition works.
          return {};
        };
      }

      const result = await handoffsTransitions.executeTransition({
        handoffId: req.params.id,
        actorId: req.userId!,
        actorRole: req.role,
        facilityId,
        targetState,
        clientEventId,
        payload: schema ? payload : undefined,
        reason,
        mutationFn,
      });

      res.status(result.isDuplicate ? 200 : 201).json({ ok: true, data: result.handoff });
    } catch (e: any) {
      if (e instanceof TransitionError) {
        return res.status(409).json({
          ok: false,
          error: {
            code: "CONFLICT",
            message: e.message,
            currentState: e.currentState,
            attemptedTransition: e.attemptedTransition,
            validNextStates: e.validNextStates,
          },
        });
      }
      if (e.message === "UNAUTHORIZED_FACILITY") {
        return res
          .status(403)
          .json({
            ok: false,
            error: { code: "FORBIDDEN", message: "Facility unauthorized for this transition" },
          });
      }
      if (e.message === "NOT_FOUND") {
        return res
          .status(404)
          .json({ ok: false, error: { code: "NOT_FOUND", message: "Handoff not found" } });
      }
      if (e.message === "CONFLICT_CLIENT_EVENT") {
        return res
          .status(409)
          .json({
            ok: false,
            error: { code: "CONFLICT", message: "Client event ID reused with conflicting data" },
          });
      }
      if (e.message === "REDIRECT_LIMIT_REACHED" || e.message === "REDIRECT_SAME_DESTINATION") {
        return res
          .status(400)
          .json({ ok: false, error: { code: "BAD_REQUEST", message: e.message } });
      }
      next(e);
    }
  };
};

handoffsRouter.post(
  "/:id/acknowledge",
  requireRole("destination"),
  handleTransition("acknowledged", baseTransitionSchema),
);
handoffsRouter.post(
  "/:id/accept",
  requireRole("destination"),
  handleTransition("accepted", baseTransitionSchema),
);
handoffsRouter.post(
  "/:id/cannot-accept",
  requireRole("destination"),
  handleTransition("cannot_accept", cannotAcceptSchema),
);
handoffsRouter.post(
  "/:id/redirect",
  requireRole("destination"),
  handleTransition("redirected", redirectSchema),
);
handoffsRouter.post(
  "/:id/arrived",
  requireRole("destination"),
  handleTransition("arrived", baseTransitionSchema),
);
handoffsRouter.post(
  "/:id/no-show",
  requireRole("destination"),
  handleTransition("no_show", baseTransitionSchema),
);
handoffsRouter.post(
  "/:id/start-care",
  requireRole("destination"),
  handleTransition("in_care", baseTransitionSchema),
);
handoffsRouter.post(
  "/:id/outcome",
  requireRole("destination"),
  handleTransition("outcome_recorded", outcomeSchema),
);
