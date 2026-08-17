require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createDemo(username, lifetimeHype, stage, premiumCurrency) {
  const passwordHash = await bcrypt.hash("pepe12345", 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash }
  });

  await prisma.gameState.upsert({
    where: { userId: user.id },
    update: { lifetimeHype, hype: Math.floor(lifetimeHype * 0.05), stage, premiumCurrency },
    create: {
      userId: user.id,
      lifetimeHype,
      hype: Math.floor(lifetimeHype * 0.05),
      stage,
      premiumCurrency,
      clickPower: stage + 1,
      hypePerSecond: stage * 100
    }
  });
}

async function main() {
  await createDemo("pepegod", 84200000, 5, 500);
  await createDemo("frogmaster", 62800000, 5, 300);
  await createDemo("memelord", 41300000, 4, 180);
  console.log("Demo users created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
