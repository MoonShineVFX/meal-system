-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PREPARING', 'DISHED_UP', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PREPARING';

-- CreateIndex
CREATE INDEX "Order_menuId_status_createdAt_idx" ON "Order"("menuId", "status", "createdAt");
