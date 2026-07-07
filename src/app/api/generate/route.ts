import { NextRequest, NextResponse } from "next/server";
import { generateReportText } from "@/lib/ollama";
import { buildPdfFilename, generateReportPdf } from "@/lib/pdf";
import { buildReportContext, validateReportInput } from "@/lib/validate";

export async function POST(request: NextRequest) {
  try {
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

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Report generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
