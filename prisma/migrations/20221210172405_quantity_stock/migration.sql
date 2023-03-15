/*
  Warnings:

  - You are about to drop the column `SKU` on the `CommodityOnMenu` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommodityOnMenu" DROP COLUMN "SKU",
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "quantity" INTEGER NOT NULL;
