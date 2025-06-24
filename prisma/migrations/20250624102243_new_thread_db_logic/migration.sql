/*
  Warnings:

  - The primary key for the `Threads` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Threads" (
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_user_message" TEXT NOT NULL,
    "thread_initial_message" TEXT NOT NULL,

    PRIMARY KEY ("guild_id", "thread_initial_message")
);
INSERT INTO "new_Threads" ("first_user_message", "guild_id", "thread_initial_message", "user_id") SELECT "first_user_message", "guild_id", "thread_initial_message", "user_id" FROM "Threads";
DROP TABLE "Threads";
ALTER TABLE "new_Threads" RENAME TO "Threads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
