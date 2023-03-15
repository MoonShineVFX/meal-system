-- CreateIndex
CREATE INDEX "Order_menuId_timeClosed_timeCanceled_createdAt_idx" ON "Order"("menuId", "timeClosed", "timeCanceled", "createdAt" DESC);
