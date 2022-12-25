/*
  Warnings:

  - You are about to drop the column `refundTransactionId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[canceledTransactionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CANCELED';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_refundTransactionId_fkey";

-- DropIndex
DROP INDEX "Order_refundTransactionId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "refundTransactionId",
ADD COLUMN     "canceledTransactionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Order_canceledTransactionId_key" ON "Order"("canceledTransactionId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_canceledTransactionId_fkey" FOREIGN KEY ("canceledTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
