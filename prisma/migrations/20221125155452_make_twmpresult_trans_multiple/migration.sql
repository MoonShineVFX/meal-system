/*
  Warnings:

  - You are about to drop the column `transactionId` on the `TwmpResult` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TwmpResult_transactionId_key";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "twmpResultId" TEXT;

-- AlterTable
ALTER TABLE "TwmpResult" DROP COLUMN "transactionId";
