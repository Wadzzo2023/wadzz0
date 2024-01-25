import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const asset = await prisma.asset.create({
    data: { code: "BTC", issuer: "Bitcoin" },
  });
  const creator = await prisma.creator.create({
    data: { user: { create: { id: "user1" } }, name: "test user", bio: "test" },
  });
  const post = await prisma.post.create({
    data: {
      content: "vongCong",
      creatorId: creator.id,
      // subscriptionId: subscription.id,
    },
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
