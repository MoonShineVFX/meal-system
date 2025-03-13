-- DropIndex
DROP INDEX "CartItem_userId_menuId_commodityId_invalid_idx";

-- DropIndex
DROP INDEX "Commodity_id_isDeleted_idx";

-- DropIndex
DROP INDEX "CommodityOnMenu_menuId_commodityId_isDeleted_idx";

-- DropIndex
DROP INDEX "Menu_id_isDeleted_createdAt_idx";

-- DropIndex
DROP INDEX "Order_menuId_status_createdAt_idx";

-- DropIndex
DROP INDEX "OrderItem_orderId_menuId_commodityId_idx";

-- DropIndex
DROP INDEX "Supplier_id_isDeleted_idx";

-- DropIndex
DROP INDEX "Transaction_bonusId_idx";

-- DropIndex
DROP INDEX "Transaction_depositId_idx";

-- DropIndex
DROP INDEX "User_id_isDeactivated_idx";

-- CreateIndex
CREATE INDEX "CartItem_invalid_idx" ON "CartItem"("invalid");

-- CreateIndex
CREATE INDEX "Commodity_isDeleted_idx" ON "Commodity"("isDeleted");

-- CreateIndex
CREATE INDEX "CommodityOnMenu_isDeleted_idx" ON "CommodityOnMenu"("isDeleted");

-- CreateIndex
CREATE INDEX "Menu_isDeleted_createdAt_idx" ON "Menu"("isDeleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Menu_type_isDeleted_idx" ON "Menu"("type", "isDeleted");

-- CreateIndex
CREATE INDEX "Order_status_menuId_createdAt_idx" ON "Order"("status", "menuId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Supplier_isDeleted_idx" ON "Supplier"("isDeleted");

-- CreateIndex
CREATE INDEX "Transaction_depositId_bonusId_idx" ON "Transaction"("depositId", "bonusId");

-- CreateIndex
CREATE INDEX "User_isDeactivated_idx" ON "User"("isDeactivated");
