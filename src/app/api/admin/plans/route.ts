import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authz";

export async function GET() {
  try {
    await requireSuperAdmin();
    const plans = await db.plan.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const reportsPerMonth =
      body.reportsPerMonth === null || body.reportsPerMonth === ""
        ? null
        : Number(body.reportsPerMonth);
    const maxSeats = Number(body.maxSeats ?? 1);
    const priceMonthly =
      body.priceMonthly === null || body.priceMonthly === ""
        ? null
        : Number(body.priceMonthly);
    const visionEnabled = Boolean(body.visionEnabled);

    if (!name || Number.isNaN(maxSeats) || maxSeats < 1) {
      return NextResponse.json(
        { error: "Invalid plan payload." },
        { status: 400 }
      );
    }

    const plan = await db.plan.create({
      data: {
        name,
        reportsPerMonth: Number.isNaN(reportsPerMonth ?? 0) ? null : reportsPerMonth,
        maxSeats,
        priceMonthly,
        visionEnabled,
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Failed to create plan:", error);
    return NextResponse.json({ error: "Could not create plan." }, { status: 400 });
  }
}
