/*
  Warnings:

  - The values [CANCEL] on the enum `TwmpStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TwmpStatus_new" AS ENUM ('SUCCESS', 'FAILED', 'CANCELED');
ALTER TABLE "TwmpDetail" ALTER COLUMN "status" TYPE "TwmpStatus_new" USING ("status"::text::"TwmpStatus_new");
ALTER TYPE "TwmpStatus" RENAME TO "TwmpStatus_old";
ALTER TYPE "TwmpStatus_new" RENAME TO "TwmpStatus";
DROP TYPE "TwmpStatus_old";
COMMIT;
