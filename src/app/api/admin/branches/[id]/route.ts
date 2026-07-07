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

    const branch = await db.branch.update({
      where: { id },
      data: {
        name: body.name,
        contactEmail: body.contactEmail,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Failed to update branch:", error);
    return NextResponse.json({ error: "Could not update branch." }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    await db.branch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete branch:", error);
    return NextResponse.json({ error: "Could not delete branch." }, { status: 400 });
  }
}
