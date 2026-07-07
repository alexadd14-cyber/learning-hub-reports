import { NextRequest, NextResponse } from "next/server";
import { analyzeMarkedPaper } from "@/lib/vision";

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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Marking analysis failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyse the photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60;
