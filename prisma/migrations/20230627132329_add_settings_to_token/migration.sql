-- AlterTable
ALTER TABLE "UserToken" ADD COLUMN     "badgeEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationEnabled" BOOLEAN NOT NULL DEFAULT true;
