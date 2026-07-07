import { PrismaClient, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Starter",
      reportsPerMonth: 50,
      visionEnabled: false,
      maxSeats: 3,
    },
    {
      name: "Standard",
      reportsPerMonth: 200,
      visionEnabled: true,
      maxSeats: 10,
    },
    {
      name: "Pro",
      reportsPerMonth: null,
      visionEnabled: true,
      maxSeats: 50,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  const branch = await prisma.branch.upsert({
    where: { slug: "hq-demo-branch" },
    update: {
      name: "HQ Demo Branch",
      contactEmail: "admin@learninghub.local",
      isActive: true,
    },
    create: {
      name: "HQ Demo Branch",
      slug: "hq-demo-branch",
      contactEmail: "admin@learninghub.local",
      isActive: true,
    },
  });

  const standardPlan = await prisma.plan.findUnique({
    where: { name: "Standard" },
  });

  if (!standardPlan) {
    throw new Error("Standard plan missing after seed upsert");
  }

  await prisma.subscription.upsert({
    where: { id: `seed-subscription-${branch.id}` },
    update: {
      status: SubscriptionStatus.active,
      planId: standardPlan.id,
      branchId: branch.id,
      startsAt: new Date(),
    },
    create: {
      id: `seed-subscription-${branch.id}`,
      branchId: branch.id,
      planId: standardPlan.id,
      status: SubscriptionStatus.active,
      startsAt: new Date(),
    },
  });

  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@learninghub.local" },
    update: {
      role: UserRole.super_admin,
      passwordHash,
      branchId: null,
      name: "HQ Admin",
    },
    create: {
      email: "admin@learninghub.local",
      name: "HQ Admin",
      role: UserRole.super_admin,
      passwordHash,
      branchId: null,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
