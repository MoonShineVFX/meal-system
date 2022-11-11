/*
  Warnings:

  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL,
ALTER COLUMN "pointsAmount" SET DEFAULT 0,
ALTER COLUMN "creditsAmount" SET DEFAULT 0;

-- DropEnum
DROP TYPE "CurrencyType";

-- CreateIndex
CREATE INDEX "Transaction_sourceUserId_targetUserId_type_createdAt_idx" ON "Transaction"("sourceUserId", "targetUserId", "type", "createdAt" DESC);
