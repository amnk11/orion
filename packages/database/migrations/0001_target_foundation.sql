CREATE TABLE "care_episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_code" text NOT NULL,
	"patient_id" uuid NOT NULL,
	"opened_by_facility_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"close_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"protocol_code" text NOT NULL,
	"answers_json" jsonb NOT NULL,
	"triage_json" jsonb NOT NULL,
	"assessed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handoff_id" uuid NOT NULL,
	"episode_id" uuid NOT NULL,
	"disposition" text NOT NULL,
	"summary" text NOT NULL,
	"tests_advised" text[],
	"advice_summary" text,
	"follow_up_due_at" timestamp,
	"follow_up_facility_id" uuid,
	"recorded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"handoff_id" uuid,
	"facility_id" uuid NOT NULL,
	"assigned_role" text,
	"task" text NOT NULL,
	"due_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"completed_by" uuid,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "facility_id" SET DATA TYPE uuid USING (NULLIF("facility_id", '')::uuid);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "designation" text;--> statement-breakpoint
ALTER TABLE "facilities" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "is_synthetic" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "source" text DEFAULT 'attestation' NOT NULL;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "episode_id" uuid;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "reason_for_referral" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "requested_services" text[];--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "transport_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "transport_ref" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "teleconsult_ref" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "expected_arrival_at" timestamp;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "redirect_reason" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "client_event_id" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD COLUMN "episode_id" uuid;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD COLUMN "actor_role" text;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD COLUMN "facility_id" uuid;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "care_episodes" ADD CONSTRAINT "care_episodes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_episodes" ADD CONSTRAINT "care_episodes_opened_by_facility_id_facilities_id_fk" FOREIGN KEY ("opened_by_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_protocol_code_protocols_code_fk" FOREIGN KEY ("protocol_code") REFERENCES "public"."protocols"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assessed_by_users_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_handoff_id_handoffs_id_fk" FOREIGN KEY ("handoff_id") REFERENCES "public"."handoffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_follow_up_facility_id_facilities_id_fk" FOREIGN KEY ("follow_up_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_handoff_id_handoffs_id_fk" FOREIGN KEY ("handoff_id") REFERENCES "public"."handoffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_care_episodes_public_code" ON "care_episodes" USING btree ("public_code");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_patient" ON "care_episodes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_opened_by_facility" ON "care_episodes" USING btree ("opened_by_facility_id");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_status" ON "care_episodes" USING btree ("status","opened_at");--> statement-breakpoint
CREATE INDEX "idx_assessments_episode" ON "assessments" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_assessments_protocol" ON "assessments" USING btree ("protocol_code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_outcomes_handoff" ON "outcomes" USING btree ("handoff_id");--> statement-breakpoint
CREATE INDEX "idx_outcomes_episode" ON "outcomes" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_outcomes_follow_up_facility" ON "outcomes" USING btree ("follow_up_facility_id");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_episode" ON "follow_ups" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_facility_status_due" ON "follow_ups" USING btree ("facility_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_follow_ups_idempotency_key" ON "follow_ups" USING btree ("idempotency_key");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD CONSTRAINT "handoff_events_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD CONSTRAINT "handoff_events_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_facility_id" ON "users" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_caps_facility_service_unique" ON "capabilities" USING btree ("facility_id","service_code");--> statement-breakpoint
CREATE INDEX "idx_handoffs_episode" ON "handoffs" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_handoffs_assessment" ON "handoffs" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "idx_events_episode" ON "handoff_events" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_events_facility" ON "handoff_events" USING btree ("facility_id");