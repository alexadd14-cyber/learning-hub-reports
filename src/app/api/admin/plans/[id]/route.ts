import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authz";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();

    const plan = await db.plan.update({
      where: { id },
      data: {
        name: body.name,
        reportsPerMonth: body.reportsPerMonth,
        maxSeats: body.maxSeats,
        priceMonthly: body.priceMonthly,
        visionEnabled: body.visionEnabled,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to update plan:", error);
    return NextResponse.json({ error: "Could not update plan." }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    await db.plan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return NextResponse.json({ error: "Could not delete plan." }, { status: 400 });
  }
}
