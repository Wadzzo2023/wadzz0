/*
  Warnings:

  - You are about to drop the column `entiryId` on the `NotificationObject` table. All the data in the column will be lost.
  - Added the required column `entityId` to the `NotificationObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `NotificationObject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'SUBSCRIPTION', 'POST', 'SHOP_ASSET');

-- AlterTable
ALTER TABLE "NotificationObject" DROP COLUMN "entiryId",
ADD COLUMN     "entityId" INTEGER NOT NULL,
ADD COLUMN     "entityType" "NotificationType" NOT NULL;
