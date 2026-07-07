import { PrismaClient } from "@prisma/client";
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

  const standardPlan = await prisma.plan.findUnique({
    where: { name: "Standard" },
  });

  if (!standardPlan) {
    throw new Error("Standard plan missing after seed upsert");
  }

  // HQ super admin (manages branches, plans, subscriptions)
  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@learninghub.local" },
    update: {
      role: "super_admin",
      passwordHash: adminPasswordHash,
      branchId: null,
      name: "HQ Admin",
    },
    create: {
      email: "admin@learninghub.local",
      name: "HQ Admin",
      role: "super_admin",
      passwordHash: adminPasswordHash,
      branchId: null,
    },
  });

  // Demo branch for showing the report system working end to end
  const eastHam = await prisma.branch.upsert({
    where: { slug: "east-ham" },
    update: {
      name: "East Ham Branch",
      contactEmail: "eastham@learninghub.local",
      isActive: true,
    },
    create: {
      name: "East Ham Branch",
      slug: "east-ham",
      contactEmail: "eastham@learninghub.local",
      isActive: true,
    },
  });

  await prisma.subscription.upsert({
    where: { id: `seed-subscription-${eastHam.id}` },
    update: {
      status: "active",
      planId: standardPlan.id,
      branchId: eastHam.id,
      startsAt: new Date(),
    },
    create: {
      id: `seed-subscription-${eastHam.id}`,
      branchId: eastHam.id,
      planId: standardPlan.id,
      status: "active",
      startsAt: new Date(),
    },
  });

  const demoPasswordHash = await bcrypt.hash("Demo123!", 10);
  await prisma.user.upsert({
    where: { email: "demo@eastham.local" },
    update: {
      role: "branch_user",
      passwordHash: demoPasswordHash,
      branchId: eastHam.id,
      name: "East Ham Tutor",
    },
    create: {
      email: "demo@eastham.local",
      name: "East Ham Tutor",
      role: "branch_user",
      passwordHash: demoPasswordHash,
      branchId: eastHam.id,
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
