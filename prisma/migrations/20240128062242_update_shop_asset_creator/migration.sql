/*
  Warnings:

  - You are about to drop the column `userId` on the `ShopAsset` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `ShopAsset` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ShopAsset" DROP CONSTRAINT "ShopAsset_userId_fkey";

-- AlterTable
ALTER TABLE "ShopAsset" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ShopAsset" ADD CONSTRAINT "ShopAsset_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
