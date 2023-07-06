/*
  Warnings:

  - You are about to drop the column `notificationSound` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `qrcodeAutoCheckout` on the `UserSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "notificationSound",
DROP COLUMN "qrcodeAutoCheckout";
