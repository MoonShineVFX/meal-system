-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECHARGE', 'REFUND', 'PAYMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TwmpResultStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELED');

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
    "sourceUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
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
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "options" TEXT[],
    "orderId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "imageId" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "options" TEXT[],
    "userId" TEXT NOT NULL,
    "menuId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mainName" TEXT NOT NULL,
    "subName" TEXT NOT NULL,

    CONSTRAINT "CommodityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOptionSetTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "multiSelect" BOOLEAN NOT NULL,
    "options" TEXT[],

    CONSTRAINT "CommodityOptionSetTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commodity" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "optionSets" JSON NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "imageId" TEXT,

    CONSTRAINT "Commodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOnMenu" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "limitPerUser" INTEGER NOT NULL DEFAULT 0,
    "SKU" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "commodityId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,

    CONSTRAINT "CommodityOnMenu_pkey" PRIMARY KEY ("menuId","commodityId")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" DATE,
    "type" "MenuType" NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "publishedDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "limitPerUser" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CommodityToCommodityCategory" (
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
CREATE UNIQUE INDEX "CommodityCategory_mainName_subName_key" ON "CommodityCategory"("mainName", "subName");

-- CreateIndex
CREATE UNIQUE INDEX "_CommodityToCommodityCategory_AB_unique" ON "_CommodityToCommodityCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_CommodityToCommodityCategory_B_index" ON "_CommodityToCommodityCategory"("B");

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_twmpResultId_fkey" FOREIGN KEY ("twmpResultId") REFERENCES "TwmpResult"("txnUID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwmpResult" ADD CONSTRAINT "TwmpResult_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "TwmpDeposit"("orderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwmpDeposit" ADD CONSTRAINT "TwmpDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EthWallet" ADD CONSTRAINT "EthWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuId_commodityId_fkey" FOREIGN KEY ("menuId", "commodityId") REFERENCES "CommodityOnMenu"("menuId", "commodityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_menuId_commodityId_fkey" FOREIGN KEY ("menuId", "commodityId") REFERENCES "CommodityOnMenu"("menuId", "commodityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commodity" ADD CONSTRAINT "Commodity_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOnMenu" ADD CONSTRAINT "CommodityOnMenu_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOnMenu" ADD CONSTRAINT "CommodityOnMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommodityToCommodityCategory" ADD CONSTRAINT "_CommodityToCommodityCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Commodity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommodityToCommodityCategory" ADD CONSTRAINT "_CommodityToCommodityCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "CommodityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
