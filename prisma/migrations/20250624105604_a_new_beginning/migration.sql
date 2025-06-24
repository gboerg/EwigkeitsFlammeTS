/*
  Warnings:

  - You are about to alter the column `thread_channel` on the `Threads` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Threads" (
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "thread_channel" INTEGER NOT NULL DEFAULT 0,
    "first_user_message" TEXT NOT NULL DEFAULT '0',
    "thread_initial_message" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("guild_id", "thread_initial_message")
);
INSERT INTO "new_Threads" ("first_user_message", "guild_id", "thread_channel", "thread_initial_message", "user_id") SELECT "first_user_message", "guild_id", "thread_channel", "thread_initial_message", "user_id" FROM "Threads";
DROP TABLE "Threads";
ALTER TABLE "new_Threads" RENAME TO "Threads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
