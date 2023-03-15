/*
  Warnings:

  - You are about to drop the column `timeClosed` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_menuId_timeClosed_timeCanceled_createdAt_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "timeClosed",
ADD COLUMN     "timeDishedUp" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_menuId_timeCompleted_timeCanceled_createdAt_idx" ON "Order"("menuId", "timeCompleted", "timeCanceled", "createdAt" DESC);
