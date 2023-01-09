/*
  Warnings:

  - You are about to drop the column `mainName` on the `CommodityCategory` table. All the data in the column will be lost.
  - You are about to drop the column `mainOrder` on the `CommodityCategory` table. All the data in the column will be lost.
  - You are about to drop the column `subName` on the `CommodityCategory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rootCategoryId,name]` on the table `CommodityCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `CommodityCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rootCategoryId` to the `CommodityCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CommodityCategory_mainName_subName_key";

-- AlterTable
ALTER TABLE "CommodityCategory" DROP COLUMN "mainName",
DROP COLUMN "mainOrder",
DROP COLUMN "subName",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "rootCategoryId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "CommodityRootCategory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 99,

    CONSTRAINT "CommodityRootCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommodityRootCategory_name_key" ON "CommodityRootCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommodityCategory_rootCategoryId_name_key" ON "CommodityCategory"("rootCategoryId", "name");

-- AddForeignKey
ALTER TABLE "CommodityCategory" ADD CONSTRAINT "CommodityCategory_rootCategoryId_fkey" FOREIGN KEY ("rootCategoryId") REFERENCES "CommodityRootCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
