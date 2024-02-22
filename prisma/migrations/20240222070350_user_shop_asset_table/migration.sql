-- CreateTable
CREATE TABLE "UserShopAsset" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "shopAssetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserShopAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_code_issuer_idx" ON "Asset"("code", "issuer");

-- CreateIndex
CREATE INDEX "Creator_bio_name_idx" ON "Creator"("bio", "name");

-- CreateIndex
CREATE INDEX "ShopAsset_name_description_idx" ON "ShopAsset"("name", "description");

-- AddForeignKey
ALTER TABLE "UserShopAsset" ADD CONSTRAINT "UserShopAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopAsset" ADD CONSTRAINT "UserShopAsset_shopAssetId_fkey" FOREIGN KEY ("shopAssetId") REFERENCES "ShopAsset"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
