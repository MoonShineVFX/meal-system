/*
  Warnings:

  - You are about to drop the column `payStatus` on the `Twmp` table. All the data in the column will be lost.
  - Made the column `userId` on table `Twmp` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TwmpStatus" AS ENUM ('SUCCESS', 'FAILED', 'INITIAL');

-- AlterTable
ALTER TABLE "Twmp" DROP COLUMN "payStatus",
ADD COLUMN     "status" "TwmpStatus" NOT NULL DEFAULT 'INITIAL',
ALTER COLUMN "paymentTool" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- DropEnum
DROP TYPE "TwmpPayStatus";
