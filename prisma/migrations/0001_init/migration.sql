-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERINTENDENT', 'INSPECTOR', 'SUB_INSPECTOR', 'CONSTABLE', 'ANALYST');
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'CHARGESHEET_FILED', 'CLOSED', 'REOPENED');
CREATE TYPE "ThreatLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "EvidenceType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'PHYSICAL', 'DIGITAL', 'FORENSIC');
CREATE TYPE "SuspectRole" AS ENUM ('ACCUSED', 'SUSPECT', 'WITNESS', 'VICTIM', 'INFORMANT', 'ACCOMPLICE');

-- Users
CREATE TABLE "users" (
    "id" TEXT NOT NULL, "badge_number" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'CONSTABLE', "rank" TEXT,
    "department" TEXT, "station" TEXT, "phone" TEXT, "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true, "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_badge_number_key" ON "users"("badge_number");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Refresh Tokens
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL, "token" TEXT NOT NULL, "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- Cases
CREATE TABLE "cases" (
    "id" TEXT NOT NULL, "fir_number" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
    "crime_type" TEXT NOT NULL, "ipc_sections" TEXT[], "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ThreatLevel" NOT NULL DEFAULT 'MEDIUM', "station" TEXT NOT NULL, "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Karnataka', "place" TEXT NOT NULL, "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION, "date_of_offence" TIMESTAMP(3) NOT NULL, "time_of_offence" TEXT,
    "date_of_filing" TIMESTAMP(3) NOT NULL, "estimated_loss" TEXT, "summary" TEXT,
    "ai_summary" TEXT, "ai_similarity" DOUBLE PRECISION, "ai_network_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cases_fir_number_key" ON "cases"("fir_number");
CREATE INDEX "cases_crime_type_idx" ON "cases"("crime_type");
CREATE INDEX "cases_district_idx" ON "cases"("district");
CREATE INDEX "cases_status_idx" ON "cases"("status");
CREATE INDEX "cases_date_of_offence_idx" ON "cases"("date_of_offence");

-- Persons
CREATE TABLE "persons" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "alias" TEXT, "age" INTEGER, "gender" TEXT,
    "aadhaar" TEXT, "address" TEXT, "phone" TEXT, "photo" TEXT,
    "threat_level" "ThreatLevel" NOT NULL DEFAULT 'LOW', "prior_count" INTEGER NOT NULL DEFAULT 0,
    "fingerprint" TEXT, "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "persons_aadhaar_key" ON "persons"("aadhaar");
CREATE INDEX "persons_name_idx" ON "persons"("name");
CREATE INDEX "persons_threat_level_idx" ON "persons"("threat_level");

-- Vehicles
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL, "registration" TEXT NOT NULL, "make" TEXT, "model" TEXT, "color" TEXT,
    "type" TEXT, "owner_name" TEXT, "owner_address" TEXT, "chassis_no" TEXT, "engine_no" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vehicles_registration_key" ON "vehicles"("registration");
CREATE INDEX "vehicles_registration_idx" ON "vehicles"("registration");

-- Phone Numbers
CREATE TABLE "phone_numbers" (
    "id" TEXT NOT NULL, "number" TEXT NOT NULL, "carrier" TEXT, "imei" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "phone_numbers_number_key" ON "phone_numbers"("number");

-- Bank Accounts
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL, "account_number" TEXT, "bank_name" TEXT NOT NULL, "branch" TEXT,
    "ifsc" TEXT, "holder_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- Junction Tables
CREATE TABLE "case_suspects" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "person_id" TEXT NOT NULL,
    "role" "SuspectRole" NOT NULL DEFAULT 'SUSPECT', "notes" TEXT,
    CONSTRAINT "case_suspects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "case_suspects_case_id_person_id_key" ON "case_suspects"("case_id", "person_id");

CREATE TABLE "case_vehicles" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "vehicle_id" TEXT NOT NULL, "context" TEXT,
    CONSTRAINT "case_vehicles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "case_vehicles_case_id_vehicle_id_key" ON "case_vehicles"("case_id", "vehicle_id");

CREATE TABLE "case_phones" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "phone_id" TEXT NOT NULL, "context" TEXT,
    CONSTRAINT "case_phones_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "case_phones_case_id_phone_id_key" ON "case_phones"("case_id", "phone_id");

CREATE TABLE "case_bank_accounts" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "bank_account_id" TEXT NOT NULL, "context" TEXT,
    CONSTRAINT "case_bank_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "case_bank_accounts_case_id_bank_account_id_key" ON "case_bank_accounts"("case_id", "bank_account_id");

CREATE TABLE "person_phones" (
    "id" TEXT NOT NULL, "person_id" TEXT NOT NULL, "phone_id" TEXT NOT NULL,
    CONSTRAINT "person_phones_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "person_phones_person_id_phone_id_key" ON "person_phones"("person_id", "phone_id");

-- Evidence
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "type" "EvidenceType" NOT NULL,
    "title" TEXT NOT NULL, "description" TEXT, "file_url" TEXT, "file_name" TEXT,
    "mime_type" TEXT, "file_size" INTEGER, "hash" TEXT, "extracted_text" TEXT,
    "ai_entities" JSONB, "chain_of_custody" JSONB, "collected_at" TIMESTAMP(3),
    "collected_by" TEXT, "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "evidence_case_id_idx" ON "evidence"("case_id");

-- Timeline Events
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "timestamp" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL, "description" TEXT, "event_type" TEXT NOT NULL,
    "location" TEXT, "source" TEXT, "confidence" DOUBLE PRECISION, "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "timeline_events_case_id_timestamp_idx" ON "timeline_events"("case_id", "timestamp");

-- CDR Records
CREATE TABLE "cdr_records" (
    "id" TEXT NOT NULL, "phone_id" TEXT NOT NULL, "called_number" TEXT NOT NULL,
    "duration" INTEGER, "tower_location" TEXT, "tower_lat" DOUBLE PRECISION,
    "tower_lng" DOUBLE PRECISION, "call_time" TIMESTAMP(3) NOT NULL,
    "call_type" TEXT NOT NULL DEFAULT 'OUTGOING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cdr_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cdr_records_phone_id_call_time_idx" ON "cdr_records"("phone_id", "call_time");

-- Bank Transactions
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL, "bank_account_id" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL, "location" TEXT, "reference" TEXT, "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bank_transactions_bank_account_id_timestamp_idx" ON "bank_transactions"("bank_account_id", "timestamp");

-- Network Links
CREATE TABLE "network_links" (
    "id" TEXT NOT NULL, "source_type" TEXT NOT NULL, "source_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL, "target_id" TEXT NOT NULL, "relation" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0, "is_inferred" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION, "evidence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "network_links_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "network_links_source_id_idx" ON "network_links"("source_id");
CREATE INDEX "network_links_target_id_idx" ON "network_links"("target_id");

-- Operational
CREATE TABLE "case_assignments" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Investigator',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "case_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "case_assignments_case_id_user_id_key" ON "case_assignments"("case_id", "user_id");

CREATE TABLE "notes" (
    "id" TEXT NOT NULL, "case_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL, "is_private" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notes_case_id_idx" ON "notes"("case_id");

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "title" TEXT NOT NULL,
    "message" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false, "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL, "user_id" TEXT, "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL, "entity_id" TEXT, "details" JSONB,
    "ip_address" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

CREATE TABLE "settings" (
    "id" TEXT NOT NULL, "key" TEXT NOT NULL, "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general', CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- Foreign Keys
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "case_suspects" ADD CONSTRAINT "case_suspects_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "case_suspects" ADD CONSTRAINT "case_suspects_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE;
ALTER TABLE "case_vehicles" ADD CONSTRAINT "case_vehicles_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "case_vehicles" ADD CONSTRAINT "case_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE;
ALTER TABLE "case_phones" ADD CONSTRAINT "case_phones_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "case_phones" ADD CONSTRAINT "case_phones_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "phone_numbers"("id") ON DELETE CASCADE;
ALTER TABLE "case_bank_accounts" ADD CONSTRAINT "case_bank_accounts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "case_bank_accounts" ADD CONSTRAINT "case_bank_accounts_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE;
ALTER TABLE "person_phones" ADD CONSTRAINT "person_phones_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE;
ALTER TABLE "person_phones" ADD CONSTRAINT "person_phones_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "phone_numbers"("id") ON DELETE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "cdr_records" ADD CONSTRAINT "cdr_records_phone_id_fkey" FOREIGN KEY ("phone_id") REFERENCES "phone_numbers"("id") ON DELETE CASCADE;
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE;
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "case_assignments" ADD CONSTRAINT "case_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
