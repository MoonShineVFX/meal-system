/*
  Warnings:

  - You are about to drop the column `orderId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_orderId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "orderId";

-- CreateTable
CREATE TABLE "_OrderToTransaction" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrderToTransaction_AB_unique" ON "_OrderToTransaction"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderToTransaction_B_index" ON "_OrderToTransaction"("B");

-- AddForeignKey
ALTER TABLE "_OrderToTransaction" ADD CONSTRAINT "_OrderToTransaction_A_fkey" FOREIGN KEY ("A") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToTransaction" ADD CONSTRAINT "_OrderToTransaction_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
