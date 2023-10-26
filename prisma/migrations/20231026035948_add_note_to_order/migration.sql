-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "note" TEXT;

-- CreateIndex
CREATE INDEX "Order_forClient_createdAt_idx" ON "Order"("forClient", "createdAt" DESC);
