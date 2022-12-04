-- CreateIndex
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

-- CreateIndex
CREATE INDEX "CartItem_commodityId_idx" ON "CartItem"("commodityId");

-- CreateIndex
CREATE INDEX "Commodity_categoryId_idx" ON "Commodity"("categoryId");

-- CreateIndex
CREATE INDEX "CommodityOnMenu_commodityId_idx" ON "CommodityOnMenu"("commodityId");

-- CreateIndex
CREATE INDEX "CommodityOption_setId_idx" ON "CommodityOption"("setId");

-- CreateIndex
CREATE INDEX "CommodityOptionSet_commodityId_idx" ON "CommodityOptionSet"("commodityId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_commodityId_idx" ON "OrderItem"("commodityId");

-- CreateIndex
CREATE INDEX "Transaction_sourceUserId_idx" ON "Transaction"("sourceUserId");

-- CreateIndex
CREATE INDEX "Transaction_targetUserId_idx" ON "Transaction"("targetUserId");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_twmpResultId_idx" ON "Transaction"("twmpResultId");

-- CreateIndex
CREATE INDEX "TwmpDeposit_userId_idx" ON "TwmpDeposit"("userId");

-- CreateIndex
CREATE INDEX "TwmpResult_depositId_idx" ON "TwmpResult"("depositId");

-- CreateIndex
CREATE INDEX "UserToken_userId_idx" ON "UserToken"("userId");
