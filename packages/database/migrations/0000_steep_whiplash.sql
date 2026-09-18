CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'origin' NOT NULL,
	"facility_id" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'health_system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"is_fru" boolean DEFAULT false NOT NULL,
	"block" text,
	"district" text,
	"state" text,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"age" integer,
	"sex" text,
	"abha_mock" text,
	"created_by_facility_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"schema_json" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"service_code" text NOT NULL,
	"status" text NOT NULL,
	"attested_by" uuid,
	"attested_at" timestamp DEFAULT now() NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_code" text NOT NULL,
	"patient_id" uuid,
	"origin_facility_id" uuid NOT NULL,
	"destination_facility_id" uuid NOT NULL,
	"current_destination_facility_id" uuid,
	"protocol_code" text NOT NULL,
	"urgency" text NOT NULL,
	"state" text DEFAULT 'sent' NOT NULL,
	"packet_json" jsonb NOT NULL,
	"created_by" uuid,
	"idempotency_key" text NOT NULL,
	"redirect_count" integer DEFAULT 0 NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handoff_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_seq" bigserial NOT NULL,
	"handoff_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"prev_state" text,
	"next_state" text,
	"actor_id" uuid,
	"payload" jsonb,
	"client_event_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "handoff_events_event_seq_unique" UNIQUE("event_seq")
);
--> statement-breakpoint
CREATE TABLE "outbox_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_facility_id_facilities_id_fk" FOREIGN KEY ("created_by_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_attested_by_users_id_fk" FOREIGN KEY ("attested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_origin_facility_id_facilities_id_fk" FOREIGN KEY ("origin_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_destination_facility_id_facilities_id_fk" FOREIGN KEY ("destination_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_current_destination_facility_id_facilities_id_fk" FOREIGN KEY ("current_destination_facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_protocol_code_protocols_code_fk" FOREIGN KEY ("protocol_code") REFERENCES "public"."protocols"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD CONSTRAINT "handoff_events_handoff_id_handoffs_id_fk" FOREIGN KEY ("handoff_id") REFERENCES "public"."handoffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoff_events" ADD CONSTRAINT "handoff_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_facilities_tier" ON "facilities" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_facilities_district" ON "facilities" USING btree ("district");--> statement-breakpoint
CREATE INDEX "idx_facilities_org_id" ON "facilities" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_patients_created_by_facility" ON "patients" USING btree ("created_by_facility_id");--> statement-breakpoint
CREATE INDEX "idx_caps_facility_service" ON "capabilities" USING btree ("facility_id","service_code","attested_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_handoffs_public_code" ON "handoffs" USING btree ("public_code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_handoffs_idempotency_key" ON "handoffs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_handoffs_dest_state" ON "handoffs" USING btree ("destination_facility_id","state","created_at");--> statement-breakpoint
CREATE INDEX "idx_handoffs_current_dest_state" ON "handoffs" USING btree ("current_destination_facility_id","state","created_at");--> statement-breakpoint
CREATE INDEX "idx_handoffs_origin" ON "handoffs" USING btree ("origin_facility_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_handoffs_state" ON "handoffs" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "idx_events_handoff_created" ON "handoff_events" USING btree ("handoff_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_events_handoff_seq" ON "handoff_events" USING btree ("handoff_id","event_seq");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_events_client_event_id" ON "handoff_events" USING btree ("client_event_id") WHERE client_event_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_jobs_status_run_after" ON "outbox_jobs" USING btree ("status","run_after");