/*
  Warnings:

  - You are about to drop the column `authority` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "authority",
ADD COLUMN     "authorities" "UserAuthority"[] DEFAULT ARRAY[]::"UserAuthority"[];
