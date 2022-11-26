/*
  Warnings:

  - You are about to drop the column `twmpId` on the `TwmpResult` table. All the data in the column will be lost.
  - Added the required column `twmpDepositId` to the `TwmpResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TwmpResult" DROP COLUMN "twmpId",
ADD COLUMN     "twmpDepositId" TEXT NOT NULL;
