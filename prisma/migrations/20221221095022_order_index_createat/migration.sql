-- DropIndex
DROP INDEX "Order_userId_menuId_status_idx";

-- CreateIndex
CREATE INDEX "Order_userId_menuId_status_createdAt_idx" ON "Order"("userId", "menuId", "status", "createdAt" DESC);
