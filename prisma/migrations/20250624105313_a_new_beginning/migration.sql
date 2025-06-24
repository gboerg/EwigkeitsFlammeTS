/*
  Warnings:

  - The primary key for the `Threads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `first_user_message_id` on the `Threads` table. All the data in the column will be lost.
  - You are about to drop the column `thread_channel_id` on the `Threads` table. All the data in the column will be lost.
  - You are about to drop the column `thread_initial_message_id` on the `Threads` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Threads" (
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "thread_channel" TEXT NOT NULL DEFAULT '0',
    "first_user_message" TEXT NOT NULL DEFAULT '0',
    "thread_initial_message" TEXT NOT NULL DEFAULT '0',

    PRIMARY KEY ("guild_id", "thread_initial_message")
);
INSERT INTO "new_Threads" ("guild_id", "user_id") SELECT "guild_id", "user_id" FROM "Threads";
DROP TABLE "Threads";
ALTER TABLE "new_Threads" RENAME TO "Threads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
