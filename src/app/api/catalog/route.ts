import { NextResponse } from "next/server";
import { getCatalogForClient } from "@/lib/catalog";

export async function GET() {
  try {
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
