ALTER TABLE "capabilities" RENAME TO "capability_snapshots";--> statement-breakpoint
ALTER INDEX "idx_caps_facility_service" RENAME TO "idx_capsnap_facility_service";--> statement-breakpoint
ALTER INDEX "idx_caps_facility_service_unique" RENAME TO "idx_capsnap_facility_service_unique";
