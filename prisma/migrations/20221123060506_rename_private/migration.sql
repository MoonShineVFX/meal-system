/*
  Warnings:

  - You are about to drop the column `PrivateKey` on the `Blockchain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[privateKey]` on the table `Blockchain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `privateKey` to the `Blockchain` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Blockchain_PrivateKey_key";

-- AlterTable
ALTER TABLE "Blockchain" DROP COLUMN "PrivateKey",
ADD COLUMN     "privateKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Blockchain_privateKey_key" ON "Blockchain"("privateKey");
