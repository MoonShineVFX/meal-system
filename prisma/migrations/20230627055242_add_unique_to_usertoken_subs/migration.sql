/*
  Warnings:

  - A unique constraint covering the columns `[endpoint]` on the table `UserToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[p256dh]` on the table `UserToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[auth]` on the table `UserToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserToken" ADD COLUMN     "lastUsedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_endpoint_key" ON "UserToken"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_p256dh_key" ON "UserToken"("p256dh");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_auth_key" ON "UserToken"("auth");
