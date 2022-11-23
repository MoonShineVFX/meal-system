/*
  Warnings:

  - The primary key for the `Blockchain` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `Blockchain` table. All the data in the column will be lost.
  - You are about to drop the column `privateKey` on the `Blockchain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pointAddress]` on the table `Blockchain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pointPrivateKey]` on the table `Blockchain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[creditAddress]` on the table `Blockchain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[creditPrivateKey]` on the table `Blockchain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creditAddress` to the `Blockchain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditPrivateKey` to the `Blockchain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Blockchain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pointAddress` to the `Blockchain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pointPrivateKey` to the `Blockchain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Blockchain" DROP CONSTRAINT "Blockchain_pkey",
DROP COLUMN "address",
DROP COLUMN "privateKey",
ADD COLUMN     "creditAddress" TEXT NOT NULL,
ADD COLUMN     "creditPrivateKey" TEXT NOT NULL,
ADD COLUMN     "id" INTEGER NOT NULL,
ADD COLUMN     "pointAddress" TEXT NOT NULL,
ADD COLUMN     "pointPrivateKey" TEXT NOT NULL,
ADD CONSTRAINT "Blockchain_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_pointAddress_key" ON "Blockchain"("pointAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_pointPrivateKey_key" ON "Blockchain"("pointPrivateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_creditAddress_key" ON "Blockchain"("creditAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_creditPrivateKey_key" ON "Blockchain"("creditPrivateKey");
