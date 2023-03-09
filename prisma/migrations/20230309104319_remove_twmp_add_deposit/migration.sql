/*
  Warnings:

  - You are about to drop the column `twmpResultId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `ServerRefill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TwmpDeposit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TwmpResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_twmpResultId_fkey";

-- DropForeignKey
ALTER TABLE "TwmpDeposit" DROP CONSTRAINT "TwmpDeposit_userId_fkey";

-- DropForeignKey
ALTER TABLE "TwmpResult" DROP CONSTRAINT "TwmpResult_depositId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "twmpResultId",
ADD COLUMN     "depositId" INTEGER;

-- DropTable
DROP TABLE "ServerRefill";

-- DropTable
DROP TABLE "Setting";

-- DropTable
DROP TABLE "TwmpDeposit";

-- DropTable
DROP TABLE "TwmpResult";

-- DropEnum
DROP TYPE "SettingType";

-- DropEnum
DROP TYPE "TwmpResultStatus";

-- CreateTable
CREATE TABLE "Deposit" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "paymentType" TEXT,
    "payTime" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
