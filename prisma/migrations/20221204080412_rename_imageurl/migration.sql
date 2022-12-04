/*
  Warnings:

  - You are about to drop the column `image` on the `Commodity` table. All the data in the column will be lost.
  - You are about to drop the column `commoditySnapshot` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Commodity" DROP COLUMN "image",
ADD COLUMN     "imageUrlUrl" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "commoditySnapshot",
DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;
