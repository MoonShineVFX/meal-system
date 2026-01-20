-- DropIndex
DROP INDEX "Bonus_id_createdAt_isDeleted_idx";

-- DropIndex
DROP INDEX "Commodity_isDeleted_idx";

-- DropIndex
DROP INDEX "CommodityOnMenu_isDeleted_idx";

-- DropIndex
DROP INDEX "Order_createdAt_idx";

-- DropIndex
DROP INDEX "Supplier_isDeleted_idx";

-- DropIndex
DROP INDEX "Transaction_sourceUserId_targetUserId_type_createdAt_idx";

-- DropIndex
DROP INDEX "User_isDeactivated_optMenuNotify_idx";

-- CreateIndex
CREATE INDEX "Bonus_createdAt_isDeleted_idx" ON "Bonus"("createdAt", "isDeleted");

-- CreateIndex
CREATE INDEX "Order_createdAt_id_idx" ON "Order"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Transaction_sourceUserId_type_createdAt_idx" ON "Transaction"("sourceUserId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_targetUserId_type_createdAt_idx" ON "Transaction"("targetUserId", "type", "createdAt" DESC);
