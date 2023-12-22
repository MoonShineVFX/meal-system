-- DropIndex
DROP INDEX "Bonus_id_createdAt_idx";

-- CreateIndex
CREATE INDEX "Bonus_id_createdAt_isDeleted_idx" ON "Bonus"("id", "createdAt", "isDeleted");

-- CreateIndex
CREATE INDEX "Transaction_depositId_idx" ON "Transaction"("depositId");

-- CreateIndex
CREATE INDEX "Transaction_bonusId_idx" ON "Transaction"("bonusId");
