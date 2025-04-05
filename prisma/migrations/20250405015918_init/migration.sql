-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "exchanges" (
    "exchange_id" TEXT NOT NULL PRIMARY KEY,
    "exchange_name" TEXT NOT NULL,
    "api_base_url" TEXT,
    "ws_base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "api_key_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "exchange_id" TEXT NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "api_secret_encrypted" TEXT NOT NULL,
    "key_nickname" TEXT,
    "permissions" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_valid" BOOLEAN,
    CONSTRAINT "user_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_api_keys_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges" ("exchange_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_exchange_name_key" ON "exchanges"("exchange_name");

-- CreateIndex
CREATE INDEX "user_api_keys_user_id_idx" ON "user_api_keys"("user_id");

-- CreateIndex
CREATE INDEX "user_api_keys_user_id_exchange_id_idx" ON "user_api_keys"("user_id", "exchange_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_keys_user_id_exchange_id_key_nickname_key" ON "user_api_keys"("user_id", "exchange_id", "key_nickname");
