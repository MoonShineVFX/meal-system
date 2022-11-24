/*
  Warnings:

  - You are about to drop the column `blockchainHash` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "blockchainHash",
ADD COLUMN     "blockchainHashes" TEXT[];
