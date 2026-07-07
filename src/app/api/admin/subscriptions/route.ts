import { NextRequest, NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authz";

export async function GET() {
  try {
    await requireSuperAdmin();
    const subscriptions = await db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { branch: true, plan: true },
    });
    return NextResponse.json(subscriptions);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const branchId = String(body.branchId ?? "");
    const planId = String(body.planId ?? "");
    const status = String(body.status ?? "trial") as SubscriptionStatus;

    if (!branchId || !planId) {
      return NextResponse.json(
        { error: "branchId and planId are required." },
        { status: 400 }
      );
    }

    const subscription = await db.subscription.create({
      data: {
        branchId,
        planId,
        status,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
      include: { branch: true, plan: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Could not create subscription." },
      { status: 400 }
    );
  }
}
