/*
  Warnings:

  - The primary key for the `Blockchain` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `creditAddress` on the `Blockchain` table. All the data in the column will be lost.
  - You are about to drop the column `creditPrivateKey` on the `Blockchain` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Blockchain` table. All the data in the column will be lost.
  - You are about to drop the column `pointAddress` on the `Blockchain` table. All the data in the column will be lost.
  - You are about to drop the column `pointPrivateKey` on the `Blockchain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[PrivateKey]` on the table `Blockchain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `PrivateKey` to the `Blockchain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Blockchain` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Blockchain_creditAddress_key";

-- DropIndex
DROP INDEX "Blockchain_creditPrivateKey_key";

-- DropIndex
DROP INDEX "Blockchain_pointAddress_key";

-- DropIndex
DROP INDEX "Blockchain_pointPrivateKey_key";

-- AlterTable
ALTER TABLE "Blockchain" DROP CONSTRAINT "Blockchain_pkey",
DROP COLUMN "creditAddress",
DROP COLUMN "creditPrivateKey",
DROP COLUMN "id",
DROP COLUMN "pointAddress",
DROP COLUMN "pointPrivateKey",
ADD COLUMN     "PrivateKey" TEXT NOT NULL,
ADD COLUMN     "address" TEXT NOT NULL,
ADD CONSTRAINT "Blockchain_pkey" PRIMARY KEY ("address");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_PrivateKey_key" ON "Blockchain"("PrivateKey");
