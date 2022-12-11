/*
  Warnings:

  - Added the required column `quantity` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "quantity" INTEGER NOT NULL;
