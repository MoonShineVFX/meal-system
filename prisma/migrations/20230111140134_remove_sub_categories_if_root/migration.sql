-- DropForeignKey
ALTER TABLE "CommodityCategory" DROP CONSTRAINT "CommodityCategory_rootCategoryId_fkey";

-- AddForeignKey
ALTER TABLE "CommodityCategory" ADD CONSTRAINT "CommodityCategory_rootCategoryId_fkey" FOREIGN KEY ("rootCategoryId") REFERENCES "CommodityRootCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
