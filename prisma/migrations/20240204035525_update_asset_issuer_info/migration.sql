/*
  Warnings:

  - You are about to drop the column `code` on the `ShopAsset` table. All the data in the column will be lost.
  - You are about to drop the column `issuer` on the `ShopAsset` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuerPrivate` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assetId` to the `ShopAsset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `User_Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "escrow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issuerPrivate" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ShopAsset" DROP COLUMN "code",
DROP COLUMN "issuer",
ADD COLUMN     "assetId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User_Subscription" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAsset" ADD CONSTRAINT "ShopAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
