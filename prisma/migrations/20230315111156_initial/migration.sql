-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECHARGE', 'PAYMENT', 'CANCELED', 'TRANSFER', 'REFUND', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUND');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'TEA', 'LIVE', 'RETAIL');

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
    "pointBalance" INTEGER NOT NULL DEFAULT 0,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT,
    "lastPointRechargeTime" TIMESTAMP(3),
    "profileImageId" TEXT,

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
    "ethHashes" TEXT[],
    "depositId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" TEXT,
    "payTime" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
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
    "timePreparing" TIMESTAMP(3),
    "timeDishedUp" TIMESTAMP(3),
    "timeCompleted" TIMESTAMP(3),
    "timeCanceled" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "menuId" INTEGER NOT NULL,
    "paymentTransactionId" INTEGER,
    "canceledTransactionId" INTEGER,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "options" JSON NOT NULL,
    "orderId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "imageId" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "options" JSON NOT NULL,
    "optionsKey" TEXT NOT NULL,
    "invalid" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "menuId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("userId","menuId","commodityId","optionsKey")
);

-- CreateTable
CREATE TABLE "CommodityRootCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 99,

    CONSTRAINT "CommodityRootCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 99,
    "subOrder" INTEGER NOT NULL DEFAULT 99,
    "rootCategoryId" INTEGER NOT NULL,

    CONSTRAINT "CommodityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOptionSetsTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 99,
    "optionSets" JSON NOT NULL,

    CONSTRAINT "CommodityOptionSetsTemplate_pkey" PRIMARY KEY ("id")
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
    "stock" INTEGER NOT NULL DEFAULT 0,
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
    "date" TIMESTAMP(3),
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
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CommodityToCommodityCategory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_profileImageId_key" ON "User"("profileImageId");

-- CreateIndex
CREATE INDEX "Transaction_sourceUserId_targetUserId_type_createdAt_idx" ON "Transaction"("sourceUserId", "targetUserId", "type", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EthWallet_privateKey_key" ON "EthWallet"("privateKey");

-- CreateIndex
CREATE UNIQUE INDEX "EthWallet_userId_key" ON "EthWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_canceledTransactionId_key" ON "Order"("canceledTransactionId");

-- CreateIndex
CREATE INDEX "Order_userId_menuId_timePreparing_createdAt_idx" ON "Order"("userId", "menuId", "timePreparing" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_menuId_timeCompleted_timeCanceled_createdAt_idx" ON "Order"("menuId", "timeCompleted", "timeCanceled", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_menuId_commodityId_idx" ON "OrderItem"("orderId", "menuId", "commodityId");

-- CreateIndex
CREATE INDEX "CartItem_userId_menuId_commodityId_invalid_idx" ON "CartItem"("userId", "menuId", "commodityId", "invalid");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityRootCategory_name_key" ON "CommodityRootCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityCategory_rootCategoryId_name_key" ON "CommodityCategory"("rootCategoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityOptionSetsTemplate_name_key" ON "CommodityOptionSetsTemplate"("name");

-- CreateIndex
CREATE INDEX "Commodity_id_isDeleted_idx" ON "Commodity"("id", "isDeleted");

-- CreateIndex
CREATE INDEX "CommodityOnMenu_menuId_commodityId_isDeleted_idx" ON "CommodityOnMenu"("menuId", "commodityId", "isDeleted");

-- CreateIndex
CREATE INDEX "Menu_date_type_isDeleted_createdAt_idx" ON "Menu"("date", "type", "isDeleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Menu_id_isDeleted_createdAt_idx" ON "Menu"("id", "isDeleted", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "_CommodityToCommodityCategory_AB_unique" ON "_CommodityToCommodityCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_CommodityToCommodityCategory_B_index" ON "_CommodityToCommodityCategory"("B");

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EthWallet" ADD CONSTRAINT "EthWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_canceledTransactionId_fkey" FOREIGN KEY ("canceledTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "CommodityCategory" ADD CONSTRAINT "CommodityCategory_rootCategoryId_fkey" FOREIGN KEY ("rootCategoryId") REFERENCES "CommodityRootCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
