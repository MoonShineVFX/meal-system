/*
  Warnings:

  - Changed the type of `type` on the `Setting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "type",
ADD COLUMN     "type" "SettingType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPointRechargeTime" TIMESTAMP(3);
