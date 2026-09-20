DROP INDEX "idx_capsnap_facility_service";--> statement-breakpoint
DROP INDEX "idx_capsnap_facility_service_unique";--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_patients_idempotency_key" ON "patients" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_caps_facility_service" ON "capability_snapshots" USING btree ("facility_id","service_code","attested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_caps_facility_service_unique" ON "capability_snapshots" USING btree ("facility_id","service_code");