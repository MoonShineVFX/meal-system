-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SERVER', 'ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SERVER', 'PAYMENT');

-- CreateEnum
CREATE TYPE "TwmpResultStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('SUCCESS', 'CANCELED');

-- CreateEnum
CREATE TYPE "CommodityOptionSetType" AS ENUM ('SINGLE', 'MULTI');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'TEA', 'MAIN');

-- CreateTable
CREATE TABLE "UserToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "pointBalance" INTEGER NOT NULL DEFAULT 500,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TransactionType" NOT NULL,
    "pointAmount" INTEGER NOT NULL DEFAULT 0,
    "creditAmount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "orderId" INTEGER,
    "twmpResultId" TEXT,
    "ethHashes" TEXT[],

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwmpResult" (
    "txnUID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TwmpResultStatus" NOT NULL,
    "depositId" TEXT NOT NULL,

    CONSTRAINT "TwmpResult_pkey" PRIMARY KEY ("txnUID")
);

-- CreateTable
CREATE TABLE "TwmpDeposit" (
    "orderNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transAMT" INTEGER NOT NULL,
    "txnID" TEXT,
    "callbackUrl" TEXT,
    "qrcode" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwmpDeposit_pkey" PRIMARY KEY ("orderNo")
);

-- CreateTable
CREATE TABLE "EthWallet" (
    "address" TEXT NOT NULL,
    "privateKey" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EthWallet_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'SUCCESS',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "commodityId" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommodityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOptionSetTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "data" JSON NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommodityOptionSetTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOption" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "setId" INTEGER NOT NULL,

    CONSTRAINT "CommodityOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOptionSet" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "CommodityOptionSetType" NOT NULL,
    "commodityId" INTEGER NOT NULL,

    CONSTRAINT "CommodityOptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commodity" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "categoryId" INTEGER,

    CONSTRAINT "Commodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOnMenu" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overridePrice" INTEGER,
    "limitPerUser" INTEGER NOT NULL DEFAULT 0,
    "SKU" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "commodityId" INTEGER NOT NULL,
    "menuId" INTEGER,

    CONSTRAINT "CommodityOnMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" DATE NOT NULL,
    "type" "MenuType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "publishedDate" TIMESTAMP(3) NOT NULL,
    "closedDate" TIMESTAMP(3) NOT NULL,
    "limitPerUser" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CartItemToCommodityOption" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_CommodityOptionToOrderItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TwmpDeposit_txnID_key" ON "TwmpDeposit"("txnID");

-- CreateIndex
CREATE UNIQUE INDEX "EthWallet_privateKey_key" ON "EthWallet"("privateKey");

-- CreateIndex
CREATE UNIQUE INDEX "EthWallet_userId_key" ON "EthWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityOnMenu_menuId_key" ON "CommodityOnMenu"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "_CartItemToCommodityOption_AB_unique" ON "_CartItemToCommodityOption"("A", "B");

-- CreateIndex
CREATE INDEX "_CartItemToCommodityOption_B_index" ON "_CartItemToCommodityOption"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CommodityOptionToOrderItem_AB_unique" ON "_CommodityOptionToOrderItem"("A", "B");

-- CreateIndex
CREATE INDEX "_CommodityOptionToOrderItem_B_index" ON "_CommodityOptionToOrderItem"("B");
