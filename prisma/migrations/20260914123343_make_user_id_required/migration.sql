/*
  Warnings:

  - Made the column `userId` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Sale` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "userId" SET NOT NULL;
