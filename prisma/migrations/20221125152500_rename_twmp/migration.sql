/*
  Warnings:

  - You are about to drop the `Twmp` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TwmpDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Twmp";

-- DropTable
DROP TABLE "TwmpDetail";

-- CreateTable
CREATE TABLE "TwmpResult" (
    "txnUID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TwmpStatus" NOT NULL,
    "transactionId" INTEGER,
    "twmpId" TEXT NOT NULL,

    CONSTRAINT "TwmpResult_pkey" PRIMARY KEY ("txnUID")
);

-- CreateTable
CREATE TABLE "TwmpDeposit" (
    "orderNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transAMT" INTEGER NOT NULL,
    "txnID" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwmpDeposit_pkey" PRIMARY KEY ("orderNo")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwmpResult_transactionId_key" ON "TwmpResult"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "TwmpDeposit_txnID_key" ON "TwmpDeposit"("txnID");
