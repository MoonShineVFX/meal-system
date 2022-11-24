-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "blockchainHash" TEXT;

-- CreateTable
CREATE TABLE "Blockchain" (
    "address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privateKey" TEXT,

    CONSTRAINT "Blockchain_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_userId_key" ON "Blockchain"("userId");
