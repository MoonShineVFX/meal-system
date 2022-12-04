/*
  Warnings:

  - You are about to drop the column `imageUrlUrl` on the `Commodity` table. All the data in the column will be lost.
  - The primary key for the `CommodityOnMenu` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `CommodityOnMenu` table. All the data in the column will be lost.
  - You are about to drop the column `commodityOnMenuId` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `menuId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commodityId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menuId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_commodityId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_commodityOnMenuId_fkey";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "menuId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Commodity" DROP COLUMN "imageUrlUrl",
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "CommodityOnMenu" DROP CONSTRAINT "CommodityOnMenu_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "CommodityOnMenu_pkey" PRIMARY KEY ("menuId", "commodityId");

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "commodityOnMenuId",
ADD COLUMN     "commodityId" INTEGER NOT NULL,
ADD COLUMN     "menuId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuId_commodityId_fkey" FOREIGN KEY ("menuId", "commodityId") REFERENCES "CommodityOnMenu"("menuId", "commodityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_menuId_commodityId_fkey" FOREIGN KEY ("menuId", "commodityId") REFERENCES "CommodityOnMenu"("menuId", "commodityId") ON DELETE CASCADE ON UPDATE CASCADE;
