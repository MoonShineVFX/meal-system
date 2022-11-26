/*
  Warnings:

  - Changed the type of `status` on the `TwmpResult` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TwmpResultStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "TwmpResult" DROP COLUMN "status",
ADD COLUMN     "status" "TwmpResultStatus" NOT NULL;

-- DropEnum
DROP TYPE "TwmpStatus";
