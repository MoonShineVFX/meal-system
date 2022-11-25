-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECHARGE', 'PAYMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SERVER', 'ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "TwmpStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCEL');

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointBalance" INTEGER NOT NULL DEFAULT 500,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "pointAmount" INTEGER NOT NULL DEFAULT 0,
    "creditAmount" INTEGER NOT NULL DEFAULT 0,
    "blockchainHashes" TEXT[],

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "lastRechargeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rechargeValue" INTEGER NOT NULL DEFAULT 500,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwmpDetail" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "status" "TwmpStatus" NOT NULL,
    "transactionId" INTEGER,
    "twmpId" TEXT NOT NULL,

    CONSTRAINT "TwmpDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Twmp" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transAMT" INTEGER NOT NULL,
    "txnID" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Twmp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blockchain" (
    "address" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privateKey" TEXT,

    CONSTRAINT "Blockchain_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "mealId" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "menuId" INTEGER,
    "ordersLimitPerUser" INTEGER NOT NULL DEFAULT 0,
    "ordersLimitTotal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedDate" TIMESTAMP(3) NOT NULL,
    "closedDate" TIMESTAMP(3) NOT NULL,
    "ordersLimitPerUser" INTEGER NOT NULL DEFAULT 1,
    "ordersLimitTotal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayMenu" (
    "id" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "breakfastId" INTEGER,
    "lunchId" INTEGER,
    "dinnerId" INTEGER,
    "teaId" INTEGER,

    CONSTRAINT "DayMenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_sourceUserId_targetUserId_type_createdAt_idx" ON "Transaction"("sourceUserId", "targetUserId", "type", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TwmpDetail_transactionId_key" ON "TwmpDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Twmp_txnID_key" ON "Twmp"("txnID");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_userId_key" ON "Blockchain"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_privateKey_key" ON "Blockchain"("privateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_menuId_key" ON "Meal"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "DayMenu_breakfastId_key" ON "DayMenu"("breakfastId");

-- CreateIndex
CREATE UNIQUE INDEX "DayMenu_lunchId_key" ON "DayMenu"("lunchId");

-- CreateIndex
CREATE UNIQUE INDEX "DayMenu_dinnerId_key" ON "DayMenu"("dinnerId");

-- CreateIndex
CREATE UNIQUE INDEX "DayMenu_teaId_key" ON "DayMenu"("teaId");
