-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_subscriptionId_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "subscriptionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
