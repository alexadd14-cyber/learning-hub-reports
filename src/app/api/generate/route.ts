import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateReportText } from "@/lib/ollama";
import { authOptions } from "@/lib/auth";
import { buildPdfFilename, generateReportPdf } from "@/lib/pdf";
import {
  checkUsageLimit,
  incrementUsage,
  SubscriptionError,
} from "@/lib/subscription";
import { buildReportContext, validateReportInput } from "@/lib/validate";
import { DEMO_MODE } from "@/lib/demo";

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
        await checkUsageLimit(session.user.branchId, "report");
      }
    }

    const formData = await request.formData();
    const { input, errors } = validateReportInput(formData);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
    }

    const { assessmentRef, recordedScore, maxScore, percentage } =
      buildReportContext(input);

    const report = await generateReportText({
      ...input,
      assessmentRef,
      recordedScore,
      maxScore,
      percentage,
    });

    const reportData = {
      studentName: input.studentName,
      bookName: assessmentRef.book.name,
      chapter: assessmentRef.assessment.chapter,
      assessmentTitle: assessmentRef.assessment.title,
      subject: assessmentRef.book.subject,
      recordedScore,
      maxScore,
      percentage,
      report,
      generatedAt: new Date().toISOString(),
    };

    const pdfBuffer = await generateReportPdf(reportData);
    const filename = buildPdfFilename(
      input.studentName,
      assessmentRef.assessment.title
    );

    if (!DEMO_MODE && session?.user && session.user.role !== "super_admin" && session.user.branchId) {
      await incrementUsage(session.user.branchId, "report");
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Report generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60;
