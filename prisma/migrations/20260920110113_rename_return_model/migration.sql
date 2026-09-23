/*
  Warnings:

  - You are about to drop the `Return` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Return" DROP CONSTRAINT "Return_saleId_fkey";

-- DropForeignKey
ALTER TABLE "ReturnItem" DROP CONSTRAINT "ReturnItem_returnId_fkey";

-- DropTable
DROP TABLE "Return";

-- CreateTable
CREATE TABLE "ProductReturn" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "saleId" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReturn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductReturn_userId_idx" ON "ProductReturn"("userId");

-- CreateIndex
CREATE INDEX "ProductReturn_saleId_idx" ON "ProductReturn"("saleId");

-- CreateIndex
CREATE INDEX "ProductReturn_createdAt_idx" ON "ProductReturn"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductReturn" ADD CONSTRAINT "ProductReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ProductReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
