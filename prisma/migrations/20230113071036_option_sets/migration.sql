/*
  Warnings:

  - You are about to drop the `CommodityOptionSetTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CommodityOptionSetTemplate";

-- CreateTable
CREATE TABLE "CommodityOptionSets" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CommodityOptionSets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityOption" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "multiSelect" BOOLEAN NOT NULL,
    "options" TEXT[],
    "optionSetsId" INTEGER NOT NULL,

    CONSTRAINT "CommodityOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommodityOption" ADD CONSTRAINT "CommodityOption_optionSetsId_fkey" FOREIGN KEY ("optionSetsId") REFERENCES "CommodityOptionSets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
