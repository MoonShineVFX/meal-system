/*
  Warnings:

  - You are about to drop the column `options` on the `OrderRecord` table. All the data in the column will be lost.
  - You are about to drop the column `optionsKey` on the `OrderRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,commodityId,menuType]` on the table `OrderRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "OrderRecord_userId_commodityId_optionsKey_menuType_key";

-- AlterTable
ALTER TABLE "OrderRecord" DROP COLUMN "options",
DROP COLUMN "optionsKey";

-- CreateIndex
CREATE UNIQUE INDEX "OrderRecord_userId_commodityId_menuType_key" ON "OrderRecord"("userId", "commodityId", "menuType");
