-- AlterTable
ALTER TABLE "ProductReturn" ADD COLUMN     "refundMethod" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "refundReference" TEXT,
ADD COLUMN     "refundStatus" TEXT NOT NULL DEFAULT 'COMPLETED';
