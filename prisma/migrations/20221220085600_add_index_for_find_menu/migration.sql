-- CreateIndex
CREATE INDEX "Menu_date_type_isDeleted_createdAt_idx" ON "Menu"("date", "type", "isDeleted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Menu_id_isDeleted_createdAt_idx" ON "Menu"("id", "isDeleted", "createdAt" DESC);
