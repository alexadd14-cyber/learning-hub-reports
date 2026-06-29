import { NextRequest, NextResponse } from "next/server";
import { generateReportText } from "@/lib/openai";
import { buildPdfFilename, generateReportPdf } from "@/lib/pdf";
import { readSourceText, validateReportInput } from "@/lib/validate";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const { input, errors } = validateReportInput(formData);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
    }

    const sourceText = await readSourceText(formData);
    if (!sourceText.trim()) {
      return NextResponse.json(
        { error: "Source text is empty. Please provide notes for the report." },
        { status: 400 }
      );
    }

    const fullInput = { ...input, sourceText };
    const report = await generateReportText(fullInput);

    const reportData = {
      ...fullInput,
      report,
      generatedAt: new Date().toISOString(),
    };

    const pdfBuffer = await generateReportPdf(reportData);
    const filename = buildPdfFilename(input.studentName, input.testName);

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
