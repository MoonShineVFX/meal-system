/*
  Warnings:

  - You are about to drop the column `creditsAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `pointsAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTool` on the `Twmp` table. All the data in the column will be lost.
  - You are about to drop the column `transAMT` on the `Twmp` table. All the data in the column will be lost.
  - You are about to drop the column `txnDate` on the `Twmp` table. All the data in the column will be lost.
  - You are about to drop the column `txnTime` on the `Twmp` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[txnUID]` on the table `Twmp` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TwmpStatus" ADD VALUE 'CANCEL';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "creditsAmount",
DROP COLUMN "pointsAmount",
ADD COLUMN     "creditAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Twmp" DROP COLUMN "paymentTool",
DROP COLUMN "transAMT",
DROP COLUMN "txnDate",
DROP COLUMN "txnTime",
ALTER COLUMN "txnUID" DROP NOT NULL,
ALTER COLUMN "txnUID" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits",
DROP COLUMN "points",
ADD COLUMN     "creditBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointBalance" INTEGER NOT NULL DEFAULT 500;

-- CreateIndex
CREATE UNIQUE INDEX "Twmp_txnUID_key" ON "Twmp"("txnUID");
