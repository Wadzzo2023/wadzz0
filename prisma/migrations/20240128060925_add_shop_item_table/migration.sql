-- CreateTable
CREATE TABLE "ShopAsset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "mediaUrl" TEXT,
    "thumbnail" TEXT,
    "code" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ShopAsset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShopAsset" ADD CONSTRAINT "ShopAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
