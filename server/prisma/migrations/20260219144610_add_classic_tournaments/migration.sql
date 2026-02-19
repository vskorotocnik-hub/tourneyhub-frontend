-- CreateEnum
CREATE TYPE "ClassicTournamentStatus" AS ENUM ('REGISTRATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'CLASSIC';

-- CreateTable
CREATE TABLE "ClassicTournament" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "map" TEXT NOT NULL,
    "mapImage" TEXT,
    "mode" TEXT NOT NULL,
    "server" "ServerRegion" NOT NULL DEFAULT 'EUROPE',
    "startTime" TIMESTAMP(3) NOT NULL,
    "entryFee" INTEGER NOT NULL,
    "prizePool" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "winnerCount" INTEGER NOT NULL DEFAULT 1,
    "prize1" INTEGER NOT NULL DEFAULT 0,
    "prize2" INTEGER NOT NULL DEFAULT 0,
    "prize3" INTEGER NOT NULL DEFAULT 0,
    "status" "ClassicTournamentStatus" NOT NULL DEFAULT 'REGISTRATION',
    "createdBy" TEXT NOT NULL,
    "winner1Id" TEXT,
    "winner2Id" TEXT,
    "winner3Id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ClassicTournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicRegistration" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pubgIds" TEXT[],
    "place" INTEGER,
    "prizeAmount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassicRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicMessage" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassicMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassicTournament_status_idx" ON "ClassicTournament"("status");

-- CreateIndex
CREATE INDEX "ClassicTournament_startTime_idx" ON "ClassicTournament"("startTime");

-- CreateIndex
CREATE INDEX "ClassicTournament_status_server_idx" ON "ClassicTournament"("status", "server");

-- CreateIndex
CREATE INDEX "ClassicRegistration_userId_idx" ON "ClassicRegistration"("userId");

-- CreateIndex
CREATE INDEX "ClassicRegistration_tournamentId_idx" ON "ClassicRegistration"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassicRegistration_tournamentId_userId_key" ON "ClassicRegistration"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "ClassicMessage_registrationId_createdAt_idx" ON "ClassicMessage"("registrationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClassicRegistration" ADD CONSTRAINT "ClassicRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "ClassicTournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassicRegistration" ADD CONSTRAINT "ClassicRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassicMessage" ADD CONSTRAINT "ClassicMessage_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "ClassicRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
