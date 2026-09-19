import { z } from "zod";
import { CANNOT_ACCEPT_REASONS } from "@orion/domain";

export const cannotAcceptSchema = z.object({
  reason: z.enum(CANNOT_ACCEPT_REASONS),
  clientEventId: z.string().optional(),
});

export const redirectSchema = z.object({
  destinationFacilityId: z.string().uuid("Invalid destination facility ID"),
  reason: z.string().min(1, "Reason is required for redirect"),
  clientEventId: z.string().optional(),
});

export const baseTransitionSchema = z.object({
  clientEventId: z.string().optional(),
});

export const outcomeSchema = z.object({
  disposition: z.enum(["treated_returned", "admitted", "referred_on", "deceased", "other"]),
  summary: z.string().min(1, "Summary is required"),
  testsAdvised: z.array(z.string()).optional(),
  adviceSummary: z.string().optional(),
  followUpDueAt: z.string().datetime().optional(),
  clientEventId: z.string().optional(),
});
