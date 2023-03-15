/*
  Warnings:

  - The primary key for the `Deposit` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_depositId_fkey";

-- AlterTable
ALTER TABLE "Deposit" DROP CONSTRAINT "Deposit_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Deposit_id_seq";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "depositId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
