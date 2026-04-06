/*
  Warnings:

  - You are about to drop the column `tgdbId` on the `Game` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Game_tgdbId_key";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "tgdbId";
