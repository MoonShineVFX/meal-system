/*
  Warnings:

  - Added the required column `order` to the `CommodityOptionSetsTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommodityOptionSetsTemplate" ADD COLUMN     "order" INTEGER NOT NULL;
