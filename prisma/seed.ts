import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const humans = [
  {
    address: "0x1000000000000000000000000000000000000001",
    name: "Maya Field",
    headline: "Street photos, storefront checks, short videos",
    bio: "I can take timestamped photos, film short clips, check signs, menus, queues, and local availability.",
    city: "Berlin",
    country: "DE",
    skills: ["photo", "video", "storefront", "verification"],
    categories: ["Creative", "Research"],
    rateUsd: "18.00",
    reputation: 120,
    jobsDone: 16,
    verified: true
  },
  {
    address: "0x1000000000000000000000000000000000000002",
    name: "Leo Courier",
    headline: "Errands, pickup, local delivery",
    bio: "Fast local errands with proof photos and clear receipts.",
    city: "Los Angeles",
    country: "US",
    skills: ["delivery", "pickup", "errands", "receipts"],
    categories: ["Delivery", "Home"],
    rateUsd: "25.00",
    reputation: 90,
    jobsDone: 11,
    verified: true
  },
  {
    address: "0x1000000000000000000000000000000000000003",
    name: "Ari Remote",
    headline: "Remote calls, research, human judgment",
    bio: "I handle calls, online checks, lightweight negotiation, and final human review.",
    city: "Remote",
    country: "Global",
    remote: true,
    skills: ["research", "calls", "review", "negotiation"],
    categories: ["Research", "Admin"],
    rateUsd: "15.00",
    reputation: 75,
    jobsDone: 9,
    verified: false
  }
];

async function main() {
  for (const human of humans) {
    const user = await prisma.user.upsert({
      where: { address: human.address.toLowerCase() },
      update: {},
      create: { address: human.address.toLowerCase() }
    });
    await prisma.humanProfile.upsert({
      where: { address: human.address.toLowerCase() },
      update: { ...human, address: human.address.toLowerCase(), userId: user.id },
      create: { ...human, address: human.address.toLowerCase(), userId: user.id }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    process.exit(1);
  });
