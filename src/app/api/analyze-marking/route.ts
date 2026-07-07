import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeMarkedPaper } from "@/lib/vision";
import {
  checkUsageLimit,
  incrementUsage,
  SubscriptionError,
} from "@/lib/subscription";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    if (session.user.role !== "super_admin") {
      if (!session.user.branchId) {
        return NextResponse.json(
          { error: "No branch is linked to this account." },
          { status: 403 }
        );
      }
      await checkUsageLimit(session.user.branchId, "vision");
    }

    const formData = await request.formData();
    const assessmentId = (formData.get("assessmentId") as string)?.trim();
    const image = formData.get("image") as File | null;

    if (!assessmentId) {
      return NextResponse.json(
        { error: "Please select an assessment first" },
        { status: 400 }
      );
    }

    if (!image || image.size === 0) {
      return NextResponse.json(
        { error: "Please upload a photo of the marked test" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(image.type)) {
      return NextResponse.json(
        { error: "Please upload a JPEG, PNG, or WebP image" },
        { status: 400 }
      );
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image must be smaller than 8 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await analyzeMarkedPaper(assessmentId, base64);

    if (session.user.role !== "super_admin" && session.user.branchId) {
      await incrementUsage(session.user.branchId, "vision");
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Marking analysis failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyse the photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60;
