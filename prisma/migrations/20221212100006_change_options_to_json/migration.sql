/*
  Warnings:

  - Changed the type of `options` on the `CartItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `options` on the `OrderItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "options",
ADD COLUMN     "options" JSON NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "options",
ADD COLUMN     "options" JSON NOT NULL;
