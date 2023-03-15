/*
  Warnings:

  - The primary key for the `CartItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `CartItem` table. All the data in the column will be lost.
  - Added the required column `optionsKey` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "optionsKey" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY ("userId", "menuId", "commodityId", "optionsKey");
