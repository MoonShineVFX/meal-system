-- CreateIndex
CREATE INDEX "CartItem_userId_menuId_commodityId_invalid_idx" ON "CartItem"("userId", "menuId", "commodityId", "invalid");

-- CreateIndex
CREATE INDEX "Commodity_id_isDeleted_idx" ON "Commodity"("id", "isDeleted");

-- CreateIndex
CREATE INDEX "CommodityOnMenu_menuId_commodityId_isDeleted_idx" ON "CommodityOnMenu"("menuId", "commodityId", "isDeleted");

-- CreateIndex
CREATE INDEX "Order_userId_menuId_status_idx" ON "Order"("userId", "menuId", "status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_menuId_commodityId_idx" ON "OrderItem"("orderId", "menuId", "commodityId");

-- CreateIndex
CREATE INDEX "Transaction_sourceUserId_targetUserId_type_createdAt_idx" ON "Transaction"("sourceUserId", "targetUserId", "type", "createdAt" DESC);
