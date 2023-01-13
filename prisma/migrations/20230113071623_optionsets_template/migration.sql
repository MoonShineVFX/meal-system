/*
  Warnings:

  - You are about to drop the `CommodityOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommodityOptionSets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommodityOption" DROP CONSTRAINT "CommodityOption_optionSetsId_fkey";

-- DropTable
DROP TABLE "CommodityOption";

-- DropTable
DROP TABLE "CommodityOptionSets";

-- CreateTable
CREATE TABLE "CommodityOptionSetsTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "optionSets" JSON NOT NULL,

    CONSTRAINT "CommodityOptionSetsTemplate_pkey" PRIMARY KEY ("id")
);
