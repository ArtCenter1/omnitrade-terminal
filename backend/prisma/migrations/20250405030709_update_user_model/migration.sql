/*
  Warnings:

  - You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image` on the `users` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "reset_token" TEXT,
    "reset_token_expiry" DATETIME
);
INSERT INTO "new_users" ("created_at", "email", "email_verified", "is_active", "last_login_at", "password_hash", "updated_at", "user_id") SELECT "created_at", "email", "email_verified", "is_active", "last_login_at", "password_hash", "updated_at", "user_id" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
