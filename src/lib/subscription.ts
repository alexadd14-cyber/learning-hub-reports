import { SubscriptionStatus } from "@/lib/enums";
import { db } from "@/lib/db";

export class SubscriptionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function currentPeriod(date = new Date()): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

export async function getBranchSubscription(branchId: string) {
  return db.subscription.findFirst({
    where: { branchId },
    include: { plan: true, branch: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function assertSubscriptionActive(branchId: string) {
  const subscription = await getBranchSubscription(branchId);
  if (!subscription) {
    throw new SubscriptionError("No subscription is configured for this branch.");
  }

  if (!subscription.branch.isActive) {
    throw new SubscriptionError("This branch is inactive. Please contact HQ.");
  }

  if (
    subscription.status !== SubscriptionStatus.active &&
    subscription.status !== SubscriptionStatus.trial
  ) {
    throw new SubscriptionError("Your subscription is inactive. Please contact HQ.");
  }

  return subscription;
}

async function getUsage(branchId: string, period = currentPeriod()) {
  return db.usageRecord.upsert({
    where: { branchId_period: { branchId, period } },
    update: {},
    create: {
      branchId,
      period,
      reportsGenerated: 0,
      visionCalls: 0,
    },
  });
}

export async function checkUsageLimit(
  branchId: string,
  type: "report" | "vision"
) {
  const subscription = await assertSubscriptionActive(branchId);
  const usage = await getUsage(branchId);

  if (type === "vision" && !subscription.plan.visionEnabled) {
    throw new SubscriptionError("Photo marking is not enabled for your plan.");
  }

  if (
    type === "report" &&
    subscription.plan.reportsPerMonth !== null &&
    usage.reportsGenerated >= subscription.plan.reportsPerMonth
  ) {
    throw new SubscriptionError(
      "Monthly report limit reached. Please contact HQ to upgrade."
    );
  }
}

export async function incrementUsage(
  branchId: string,
  type: "report" | "vision"
) {
  const period = currentPeriod();
  await getUsage(branchId, period);

  if (type === "report") {
    await db.usageRecord.update({
      where: { branchId_period: { branchId, period } },
      data: { reportsGenerated: { increment: 1 } },
    });
    return;
  }

  await db.usageRecord.update({
    where: { branchId_period: { branchId, period } },
    data: { visionCalls: { increment: 1 } },
  });
}
