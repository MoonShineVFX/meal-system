-- DropIndex
DROP INDEX "User_isDeactivated_idx";

-- CreateIndex
CREATE INDEX "User_isDeactivated_optMenuNotify_idx" ON "User"("isDeactivated", "optMenuNotify");
