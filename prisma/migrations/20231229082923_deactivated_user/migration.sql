-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDeactivated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_id_isDeactivated_idx" ON "User"("id", "isDeactivated");
