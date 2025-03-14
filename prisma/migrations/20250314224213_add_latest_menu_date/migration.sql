/*
  Warnings:

  - You are about to drop the column `notifyId` on the `Menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "notifyId";

-- CreateIndex
CREATE INDEX "Menu_isDeleted_type_publishedDate_idx" ON "Menu"("isDeleted", "type", "publishedDate");
