/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_userId_menuId_status_createdAt_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "timeCanceled" TIMESTAMP(3),
ADD COLUMN     "timeClosed" TIMESTAMP(3),
ADD COLUMN     "timeCompleted" TIMESTAMP(3),
ADD COLUMN     "timePreparing" TIMESTAMP(3);

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateIndex
CREATE INDEX "Order_userId_menuId_timePreparing_createdAt_idx" ON "Order"("userId", "menuId", "timePreparing" DESC, "createdAt" DESC);
