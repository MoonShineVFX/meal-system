-- DropIndex
DROP INDEX "Order_menuId_timeCompleted_timeCanceled_createdAt_idx";

-- AlterTable
ALTER TABLE "_CommodityToCommodityCategory" ADD CONSTRAINT "_CommodityToCommodityCategory_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CommodityToCommodityCategory_AB_unique";

-- AlterTable
ALTER TABLE "_bonusRedeem" ADD CONSTRAINT "_bonusRedeem_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_bonusRedeem_AB_unique";

-- AlterTable
ALTER TABLE "_bonusUsers" ADD CONSTRAINT "_bonusUsers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_bonusUsers_AB_unique";

-- CreateIndex
CREATE INDEX "Order_menuId_timeCompleted_timeCanceled_createdAt_idx" ON "Order"("menuId", "timeCompleted", "timeCanceled", "createdAt");

-- CreatePartialIndex
CREATE INDEX "Order_live_createdAt_idx" 
ON "Order" ("menuId", "createdAt")
WHERE "timeCanceled" IS NULL AND "timeCompleted" IS NULL;
