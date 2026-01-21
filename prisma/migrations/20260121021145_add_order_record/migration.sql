-- CreateTable
CREATE TABLE "OrderRecord" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "options" JSON NOT NULL,
    "optionsKey" TEXT NOT NULL,
    "menuType" TEXT NOT NULL,

    CONSTRAINT "OrderRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderRecord_userId_menuType_updatedAt_idx" ON "OrderRecord"("userId", "menuType", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "OrderRecord_userId_commodityId_optionsKey_menuType_key" ON "OrderRecord"("userId", "commodityId", "optionsKey", "menuType");

-- AddForeignKey
ALTER TABLE "OrderRecord" ADD CONSTRAINT "OrderRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRecord" ADD CONSTRAINT "OrderRecord_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
