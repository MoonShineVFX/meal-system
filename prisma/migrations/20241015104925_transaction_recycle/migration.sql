-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'RECYCLE';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "note" TEXT;
