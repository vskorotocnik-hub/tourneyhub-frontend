-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('TDM', 'WOW');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TeamMode" ADD VALUE 'TRIO';
ALTER TYPE "TeamMode" ADD VALUE 'SQUAD';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "gameType" "GameType" NOT NULL DEFAULT 'TDM',
ADD COLUMN     "wowMapId" TEXT;

-- AlterTable
ALTER TABLE "TournamentPlayer" ADD COLUMN     "extraIds" TEXT[];

-- CreateTable
CREATE TABLE "WoWMap" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "teamCount" INTEGER NOT NULL,
    "playersPerTeam" INTEGER NOT NULL,
    "rounds" INTEGER NOT NULL,
    "rules" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prizeDistribution" TEXT,

    CONSTRAINT "WoWMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WoWMap_mapId_key" ON "WoWMap"("mapId");

-- CreateIndex
CREATE INDEX "WoWMap_isActive_idx" ON "WoWMap"("isActive");

-- CreateIndex
CREATE INDEX "Tournament_gameType_status_idx" ON "Tournament"("gameType", "status");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_wowMapId_fkey" FOREIGN KEY ("wowMapId") REFERENCES "WoWMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
