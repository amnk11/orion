import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { episodesService } from "./episodes.service";
import { db, careEpisodes, handoffs, or, eq } from "@orion/db";

export const episodesRouter = Router();

episodesRouter.use(requireAuth);

/**
 * GET /api/v1/episodes/:id
 * Returns episode detail with assessments and handoffs.
 * Ensures the facility has access to this episode.
 */
episodesRouter.get("/:id", async (req, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }

    // Authorization: User's facility must be the opener or a party to any of its handoffs
    const episodeId = req.params.id;
    const [episode] = await db.select().from(careEpisodes).where(eq(careEpisodes.id, episodeId));
    
    if (!episode) {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Episode not found" } });
    }

    const hasDirectAccess = episode.openedByFacilityId === facilityId;
    
    let hasHandoffAccess = false;
    if (!hasDirectAccess) {
      const relatedHandoffs = await db.select().from(handoffs).where(eq(handoffs.episodeId, episodeId));
      hasHandoffAccess = relatedHandoffs.some(h => 
        h.originFacilityId === facilityId || 
        h.destinationFacilityId === facilityId || 
        h.currentDestinationFacilityId === facilityId
      );
    }

    if (!hasDirectAccess && !hasHandoffAccess && req.role !== "admin" && req.role !== "supervisor") {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Episode not found" } }); // 404 to isolate
    }

    const detail = await episodesService.getEpisodeDetail(episodeId);
    if (!detail) {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Episode not found" } });
    }

    res.json({ ok: true, data: detail });
  } catch (error) {
    next(error);
  }
});

import { handoffsTransitions, TransitionError } from "../handoffs/handoffs.transitions";

episodesRouter.post("/:id/close", async (req: any, res, next) => {
  try {
    const facilityId = req.facilityId;
    if (!facilityId) {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "No facility assigned" } });
    }
    
    // Find the handoff for this episode to close
    const relatedHandoffs = await db.select().from(handoffs).where(eq(handoffs.episodeId, req.params.id));
    if (relatedHandoffs.length === 0) {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Episode not found" } });
    }
    
    const handoff = relatedHandoffs[0];
    if (!handoff) {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Episode not found" } });
    }
    
    const result = await handoffsTransitions.executeTransition({
      handoffId: handoff.id,
      actorId: req.userId!,
      actorRole: req.role,
      facilityId,
      targetState: "closed",
      clientEventId: req.body?.clientEventId,
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
        }
      });
    }
    if (e.message === "UNAUTHORIZED_FACILITY") {
      return res.status(403).json({ ok: false, error: { code: "FORBIDDEN", message: "Facility unauthorized for this transition" } });
    }
    if (e.message === "NOT_FOUND") {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Episode not found" } });
    }
    next(e);
  }
});
