-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "priority" DROP DEFAULT;
DROP SEQUENCE "Subscription_priority_seq";
