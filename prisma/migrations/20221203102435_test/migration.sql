-- DropIndex
DROP INDEX "CartItem_commodityId_idx";

-- DropIndex
DROP INDEX "CartItem_userId_idx";

-- DropIndex
DROP INDEX "Commodity_categoryId_idx";

-- DropIndex
DROP INDEX "CommodityOnMenu_commodityId_idx";

-- DropIndex
DROP INDEX "CommodityOption_setId_idx";

-- DropIndex
DROP INDEX "CommodityOptionSet_commodityId_idx";

-- DropIndex
DROP INDEX "Order_userId_idx";

-- DropIndex
DROP INDEX "OrderItem_commodityId_idx";

-- DropIndex
DROP INDEX "OrderItem_orderId_idx";

-- DropIndex
DROP INDEX "Transaction_orderId_idx";

-- DropIndex
DROP INDEX "Transaction_sourceUserId_idx";

-- DropIndex
DROP INDEX "Transaction_targetUserId_idx";

-- DropIndex
DROP INDEX "Transaction_twmpResultId_idx";

-- DropIndex
DROP INDEX "TwmpDeposit_userId_idx";

-- DropIndex
DROP INDEX "TwmpResult_depositId_idx";

-- DropIndex
DROP INDEX "UserToken_userId_idx";

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_twmpResultId_fkey" FOREIGN KEY ("twmpResultId") REFERENCES "TwmpResult"("txnUID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwmpResult" ADD CONSTRAINT "TwmpResult_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "TwmpDeposit"("orderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwmpDeposit" ADD CONSTRAINT "TwmpDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EthWallet" ADD CONSTRAINT "EthWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "CommodityOnMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "CommodityOnMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOption" ADD CONSTRAINT "CommodityOption_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CommodityOptionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOptionSet" ADD CONSTRAINT "CommodityOptionSet_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commodity" ADD CONSTRAINT "Commodity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommodityCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOnMenu" ADD CONSTRAINT "CommodityOnMenu_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityOnMenu" ADD CONSTRAINT "CommodityOnMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItemToCommodityOption" ADD CONSTRAINT "_CartItemToCommodityOption_A_fkey" FOREIGN KEY ("A") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItemToCommodityOption" ADD CONSTRAINT "_CartItemToCommodityOption_B_fkey" FOREIGN KEY ("B") REFERENCES "CommodityOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommodityOptionToOrderItem" ADD CONSTRAINT "_CommodityOptionToOrderItem_A_fkey" FOREIGN KEY ("A") REFERENCES "CommodityOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommodityOptionToOrderItem" ADD CONSTRAINT "_CommodityOptionToOrderItem_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
