-- DropIndex
DROP INDEX "Order_menuId_timeCompleted_timeCanceled_createdAt_idx";

-- DropIndex
DROP INDEX "Order_userId_menuId_timePreparing_createdAt_idx";

-- CreateIndex
CREATE INDEX "Order_userId_menuId_status_timePreparing_createdAt_idx" ON "Order"("userId", "menuId", "status", "timePreparing" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_menuId_status_timeCompleted_timeCanceled_createdAt_idx" ON "Order"("menuId", "status", "timeCompleted", "timeCanceled", "createdAt");

-- CreateIndex
CREATE INDEX "UserToken_userId_createdAt_idx" ON "UserToken"("userId", "createdAt");
