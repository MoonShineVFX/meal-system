/*
  Warnings:

  - You are about to drop the column `note` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "note",
ADD COLUMN     "bonusId" INTEGER;

-- CreateTable
CREATE TABLE "Bonus" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "validAt" TIMESTAMP(3),
    "amount" INTEGER NOT NULL,

    CONSTRAINT "Bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_bonusUsers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_bonusRedeem" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Bonus_id_createdAt_idx" ON "Bonus"("id", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_bonusUsers_AB_unique" ON "_bonusUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_bonusUsers_B_index" ON "_bonusUsers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_bonusRedeem_AB_unique" ON "_bonusRedeem"("A", "B");

-- CreateIndex
CREATE INDEX "_bonusRedeem_B_index" ON "_bonusRedeem"("B");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bonusId_fkey" FOREIGN KEY ("bonusId") REFERENCES "Bonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bonusUsers" ADD CONSTRAINT "_bonusUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Bonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bonusUsers" ADD CONSTRAINT "_bonusUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bonusRedeem" ADD CONSTRAINT "_bonusRedeem_A_fkey" FOREIGN KEY ("A") REFERENCES "Bonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bonusRedeem" ADD CONSTRAINT "_bonusRedeem_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
