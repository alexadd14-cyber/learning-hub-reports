import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCatalogForClient } from "@/lib/catalog";
import { DEMO_MODE } from "@/lib/demo";

export async function GET() {
  try {
    if (!DEMO_MODE) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
      }
    }

    const catalog = getCatalogForClient();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Failed to load catalog:", error);
    return NextResponse.json(
      { error: "Failed to load assessment catalog" },
      { status: 500 }
    );
  }
}
