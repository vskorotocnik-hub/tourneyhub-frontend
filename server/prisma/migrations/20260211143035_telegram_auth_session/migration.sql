-- CreateTable
CREATE TABLE "TelegramAuthSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "telegramId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "photoUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramAuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAuthSession_token_key" ON "TelegramAuthSession"("token");

-- CreateIndex
CREATE INDEX "TelegramAuthSession_token_idx" ON "TelegramAuthSession"("token");

-- CreateIndex
CREATE INDEX "TelegramAuthSession_expiresAt_idx" ON "TelegramAuthSession"("expiresAt");
