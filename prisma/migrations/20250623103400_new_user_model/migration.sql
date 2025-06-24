/*
  Warnings:

  - A unique constraint covering the columns `[guild_id,user_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_user_id_key";

-- DropIndex
DROP INDEX "User_guild_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_guild_id_user_id_key" ON "User"("guild_id", "user_id");
