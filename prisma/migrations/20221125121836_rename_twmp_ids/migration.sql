/*
  Warnings:

  - The primary key for the `Twmp` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Twmp` table. All the data in the column will be lost.
  - The primary key for the `TwmpDetail` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TwmpDetail` table. All the data in the column will be lost.
  - The required column `orderNo` was added to the `Twmp` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `txnUID` to the `TwmpDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Twmp" DROP CONSTRAINT "Twmp_pkey",
DROP COLUMN "id",
ADD COLUMN     "orderNo" TEXT NOT NULL,
ADD CONSTRAINT "Twmp_pkey" PRIMARY KEY ("orderNo");

-- AlterTable
ALTER TABLE "TwmpDetail" DROP CONSTRAINT "TwmpDetail_pkey",
DROP COLUMN "id",
ADD COLUMN     "txnUID" TEXT NOT NULL,
ADD CONSTRAINT "TwmpDetail_pkey" PRIMARY KEY ("txnUID");
