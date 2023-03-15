/*
  Warnings:

  - You are about to drop the `_OrderToTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_OrderToTransaction" DROP CONSTRAINT "_OrderToTransaction_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToTransaction" DROP CONSTRAINT "_OrderToTransaction_B_fkey";

-- DropTable
DROP TABLE "_OrderToTransaction";

-- CreateTable
CREATE TABLE "OrdersOnTransactions" (
    "orderId" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "OrdersOnTransactions_pkey" PRIMARY KEY ("orderId","transactionId")
);

-- AddForeignKey
ALTER TABLE "OrdersOnTransactions" ADD CONSTRAINT "OrdersOnTransactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdersOnTransactions" ADD CONSTRAINT "OrdersOnTransactions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
