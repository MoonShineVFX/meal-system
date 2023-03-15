/*
  Warnings:

  - A unique constraint covering the columns `[profileImageId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_profileImageId_key" ON "User"("profileImageId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileImageId_fkey" FOREIGN KEY ("profileImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
