/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `CommodityOptionSetsTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CommodityOptionSetsTemplate_name_key" ON "CommodityOptionSetsTemplate"("name");
