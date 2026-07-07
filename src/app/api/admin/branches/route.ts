import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authz";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function GET() {
  try {
    await requireSuperAdmin();
    const branches = await db.branch.findMany({
      orderBy: { createdAt: "desc" },
      include: { subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Failed to list branches:", error);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const contactEmail = String(body.contactEmail ?? "").trim().toLowerCase();
    const slugInput = String(body.slug ?? "").trim();

    if (!name || !contactEmail) {
      return NextResponse.json(
        { error: "Name and contact email are required." },
        { status: 400 }
      );
    }

    const branch = await db.branch.create({
      data: {
        name,
        contactEmail,
        slug: toSlug(slugInput || name),
      },
    });
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Failed to create branch:", error);
    return NextResponse.json(
      { error: "Could not create branch. Check slug uniqueness." },
      { status: 400 }
    );
  }
}
