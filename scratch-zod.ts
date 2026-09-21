import { cannotAcceptSchema } from "./apps/api/src/modules/handoffs/handoffs.schemas";
console.log(cannotAcceptSchema.safeParse({ reason: "specialist_unavailable" }));
