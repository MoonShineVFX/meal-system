/*
  Warnings:

  - Added the required column `mainOrder` to the `CommodityCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subOrder` to the `CommodityCategory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'INT', 'BOOLEAN', 'JSON');

-- AlterTable
ALTER TABLE "CommodityCategory" ADD COLUMN     "mainOrder" INTEGER NOT NULL,
ADD COLUMN     "subOrder" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerRefill" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "ServerRefill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
