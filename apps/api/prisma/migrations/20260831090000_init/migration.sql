CREATE TYPE "RedeemCodeStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'DISABLED');
CREATE TYPE "OwnerAccountStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "InvitationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "redeem_codes" (
  "id" UUID NOT NULL,
  "code_hash" TEXT NOT NULL,
  "status" "RedeemCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "order_no" TEXT,
  "expires_at" TIMESTAMP(3),
  "redeemed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "redeem_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "owner_accounts" (
  "id" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "status" "OwnerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "capacity_total" INTEGER NOT NULL DEFAULT 5,
  "capacity_used" INTEGER NOT NULL DEFAULT 0,
  "pending_slots" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "owner_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "owner_capacity_nonnegative" CHECK ("capacity_total" >= 0 AND "capacity_used" >= 0 AND "pending_slots" >= 0),
  CONSTRAINT "owner_capacity_not_exceeded" CHECK ("capacity_used" + "pending_slots" <= "capacity_total")
);

CREATE TABLE "invitation_tasks" (
  "id" UUID NOT NULL,
  "public_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "masked_email" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'QUEUED',
  "failure_reason" TEXT,
  "provider_reference" TEXT,
  "redeem_code_id" UUID NOT NULL,
  "owner_account_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "invitation_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redeem_codes_code_hash_key" ON "redeem_codes"("code_hash");
CREATE UNIQUE INDEX "owner_accounts_label_key" ON "owner_accounts"("label");
CREATE UNIQUE INDEX "invitation_tasks_public_id_key" ON "invitation_tasks"("public_id");
CREATE UNIQUE INDEX "invitation_tasks_redeem_code_id_key" ON "invitation_tasks"("redeem_code_id");
CREATE INDEX "invitation_tasks_status_created_at_idx" ON "invitation_tasks"("status", "created_at");
CREATE INDEX "invitation_tasks_owner_account_id_status_idx" ON "invitation_tasks"("owner_account_id", "status");

ALTER TABLE "invitation_tasks" ADD CONSTRAINT "invitation_tasks_redeem_code_id_fkey" FOREIGN KEY ("redeem_code_id") REFERENCES "redeem_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invitation_tasks" ADD CONSTRAINT "invitation_tasks_owner_account_id_fkey" FOREIGN KEY ("owner_account_id") REFERENCES "owner_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
