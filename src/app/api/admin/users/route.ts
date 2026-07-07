import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/lib/enums";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authz";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const branchId =
      body.branchId === null || body.branchId === "" ? null : String(body.branchId);
    const role =
      body.role === "super_admin" ? UserRole.super_admin : UserRole.branch_user;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        role,
        branchId,
        passwordHash,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Could not create user." }, { status: 400 });
  }
}
