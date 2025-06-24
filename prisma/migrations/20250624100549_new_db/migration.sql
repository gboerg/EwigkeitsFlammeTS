-- CreateTable
CREATE TABLE "Threads" (
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_user_message" TEXT NOT NULL,
    "thread_initial_message" TEXT NOT NULL,

    PRIMARY KEY ("guild_id", "user_id")
);
