/*
  Warnings:

  - You are about to drop the column `isArchived` on the `CommodityOnMenu` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `CommodityOptionSetTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `CommoditySubCategory` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `CommoditySubCategory` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Menu` table. All the data in the column will be lost.
  - You are about to drop the column `commodityId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `CommodityCategory` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `menuId` on table `CommodityOnMenu` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `mainCategoryId` to the `CommoditySubCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commodityOnMenuId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commoditySnapshot` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_commodityId_fkey";

-- DropForeignKey
ALTER TABLE "CommodityOnMenu" DROP CONSTRAINT "CommodityOnMenu_menuId_fkey";

-- DropForeignKey
ALTER TABLE "CommoditySubCategory" DROP CONSTRAINT "CommoditySubCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_commodityId_fkey";

-- DropIndex
DROP INDEX "CommodityOnMenu_menuId_key";

-- AlterTable
ALTER TABLE "Commodity" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CommodityOnMenu" DROP COLUMN "isArchived",
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "menuId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CommodityOptionSetTemplate" DROP COLUMN "isArchived";

-- AlterTable
ALTER TABLE "CommoditySubCategory" DROP COLUMN "categoryId",
DROP COLUMN "isArchived",
ADD COLUMN     "mainCategoryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "isArchived",
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "commodityId",
ADD COLUMN     "commodityOnMenuId" INTEGER NOT NULL,
ADD COLUMN     "commoditySnapshot" JSONB NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "CommodityCategory";

-- CreateTable
CREATE TABLE "CommodityMainCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CommodityMainCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommodityMainCategory_name_key" ON "CommodityMainCategory"("name");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_commodityOnMenuId_fkey" FOREIGN KEY ("commodityOnMenuId") REFERENCES "CommodityOnMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "CommodityOnMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommoditySubCategory" ADD CONSTRAINT "CommoditySubCategory_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "CommodityMainCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOnMenu" ADD CONSTRAINT "CommodityOnMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
