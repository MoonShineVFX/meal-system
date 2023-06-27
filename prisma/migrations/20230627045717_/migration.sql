/*
  Warnings:

  - You are about to drop the `UserSubscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_userId_fkey";

-- AlterTable
ALTER TABLE "UserToken" ADD COLUMN     "auth" TEXT,
ADD COLUMN     "endpoint" TEXT,
ADD COLUMN     "p256dh" TEXT;

-- DropTable
DROP TABLE "UserSubscription";
