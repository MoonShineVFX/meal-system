/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Commodity` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `CommodityOptionSetTemplate` table. All the data in the column will be lost.
  - You are about to drop the `CommodityOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommodityOptionSet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CartItemToCommodityOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CommodityOptionToOrderItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `CommodityCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `optionSets` to the `Commodity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `multiSelect` to the `CommodityOptionSetTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CommodityOptionSetTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Commodity" DROP CONSTRAINT "Commodity_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CommodityOption" DROP CONSTRAINT "CommodityOption_setId_fkey";

-- DropForeignKey
ALTER TABLE "CommodityOptionSet" DROP CONSTRAINT "CommodityOptionSet_commodityId_fkey";

-- DropForeignKey
ALTER TABLE "_CartItemToCommodityOption" DROP CONSTRAINT "_CartItemToCommodityOption_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartItemToCommodityOption" DROP CONSTRAINT "_CartItemToCommodityOption_B_fkey";

-- DropForeignKey
ALTER TABLE "_CommodityOptionToOrderItem" DROP CONSTRAINT "_CommodityOptionToOrderItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_CommodityOptionToOrderItem" DROP CONSTRAINT "_CommodityOptionToOrderItem_B_fkey";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "options" TEXT[];

-- AlterTable
ALTER TABLE "Commodity" DROP COLUMN "categoryId",
ADD COLUMN     "optionSets" JSON NOT NULL,
ADD COLUMN     "subCategoryId" INTEGER;

-- AlterTable
ALTER TABLE "CommodityOptionSetTemplate" DROP COLUMN "data",
ADD COLUMN     "multiSelect" BOOLEAN NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "options" TEXT[];

-- AlterTable
ALTER TABLE "Menu" ALTER COLUMN "name" SET DEFAULT '';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "options" TEXT[];

-- DropTable
DROP TABLE "CommodityOption";

-- DropTable
DROP TABLE "CommodityOptionSet";

-- DropTable
DROP TABLE "_CartItemToCommodityOption";

-- DropTable
DROP TABLE "_CommodityOptionToOrderItem";

-- DropEnum
DROP TYPE "CommodityOptionSetType";

-- CreateTable
CREATE TABLE "CommoditySubCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CommoditySubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommoditySubCategory_name_key" ON "CommoditySubCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityCategory_name_key" ON "CommodityCategory"("name");

-- AddForeignKey
ALTER TABLE "CommoditySubCategory" ADD CONSTRAINT "CommoditySubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommodityCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commodity" ADD CONSTRAINT "Commodity_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "CommoditySubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
