import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeMarkedPaper, detectAndMark } from "@/lib/vision";
import {
  checkUsageLimit,
  incrementUsage,
  SubscriptionError,
} from "@/lib/subscription";
import { DEMO_MODE } from "@/lib/demo";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

async function filesToBase64(images: File[]): Promise<string[]> {
  const results: string[] = [];
  for (const image of images) {
    const buffer = Buffer.from(await image.arrayBuffer());
    results.push(buffer.toString("base64"));
  }
  return results;
}

function collectImages(formData: FormData): File[] {
  const images = formData
    .getAll("image")
    .filter((item): item is File => item instanceof File && item.size > 0);

  return images;
}

export async function POST(request: NextRequest) {
  try {
    const session = DEMO_MODE ? null : await getServerSession(authOptions);

    if (!DEMO_MODE) {
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
    }

    const formData = await request.formData();
    const assessmentId = (formData.get("assessmentId") as string)?.trim() || "";
    const images = collectImages(formData);

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least one photo of the marked test" },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Please upload no more than ${MAX_IMAGES} photos` },
        { status: 400 }
      );
    }

    for (const image of images) {
      if (!ALLOWED_TYPES.has(image.type)) {
        return NextResponse.json(
          { error: "Please upload JPEG, PNG, or WebP images only" },
          { status: 400 }
        );
      }

      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Each image must be smaller than 8 MB" },
          { status: 400 }
        );
      }
    }

    const imagesBase64 = await filesToBase64(images);

    const result = assessmentId
      ? await analyzeMarkedPaper(assessmentId, imagesBase64)
      : await detectAndMark(imagesBase64);

    if (!DEMO_MODE && session?.user && session.user.role !== "super_admin" && session.user.branchId) {
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
