/*
  Warnings:

  - You are about to drop the column `parentTransactionId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `OrdersOnTransactions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[refundTransactionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "OrdersOnTransactions" DROP CONSTRAINT "OrdersOnTransactions_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrdersOnTransactions" DROP CONSTRAINT "OrdersOnTransactions_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_parentTransactionId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentTransactionId" INTEGER,
ADD COLUMN     "refundTransactionId" INTEGER;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "parentTransactionId";

-- DropTable
DROP TABLE "OrdersOnTransactions";

-- CreateIndex
CREATE UNIQUE INDEX "Order_refundTransactionId_key" ON "Order"("refundTransactionId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_refundTransactionId_fkey" FOREIGN KEY ("refundTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
