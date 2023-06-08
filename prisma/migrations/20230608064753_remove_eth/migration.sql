/*
  Warnings:

  - You are about to drop the column `ethHashes` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `EthWallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EthWallet" DROP CONSTRAINT "EthWallet_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "ethHashes";

-- DropTable
DROP TABLE "EthWallet";
