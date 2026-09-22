import { Router } from "express";
import { db, handoffs, facilities, eq } from "@orion/db";

export const publicRouter = Router();

/**
 * GET /api/v1/public/status/:code
 * Public endpoint to retrieve minimal, non-PHI status of a referral using its public QR code.
 */
publicRouter.get("/status/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const [handoff] = await db
      .select({
        publicCode: handoffs.publicCode,
        state: handoffs.state,
        urgency: handoffs.urgency,
        updatedAt: handoffs.updatedAt,
        destinationName: facilities.name,
      })
      .from(handoffs)
      .leftJoin(facilities, eq(handoffs.currentDestinationFacilityId, facilities.id))
      .where(eq(handoffs.publicCode, code))
      .limit(1);

    if (!handoff) {
      // Must not leak existence of patient, just return generic unavailable
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Referral status unavailable" } });
    }

    res.json({ ok: true, data: handoff });
  } catch (error) {
    next(error);
  }
});
