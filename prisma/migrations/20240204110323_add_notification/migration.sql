-- CreateTable
CREATE TABLE "NotificationObject" (
    "id" SERIAL NOT NULL,
    "entiryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "isUser" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "nofitifactionObjectId" INTEGER NOT NULL,
    "notifierId" TEXT NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_nofitifactionObjectId_fkey" FOREIGN KEY ("nofitifactionObjectId") REFERENCES "NotificationObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
