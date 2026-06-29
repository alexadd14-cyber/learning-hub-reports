import type { ReportInput, Subject } from "@/types/report";

const VALID_SUBJECTS: Subject[] = ["maths", "english", "science"];

export interface ValidatedInput {
  input: ReportInput;
  errors: string[];
}

export function validateReportInput(formData: FormData): ValidatedInput {
  const errors: string[] = [];

  const studentName = (formData.get("studentName") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim().toLowerCase();
  const testName = (formData.get("testName") as string)?.trim();
  const percentageRaw = (formData.get("percentage") as string)?.trim();
  const sourceTextField = (formData.get("sourceText") as string)?.trim();
  const sourceFile = formData.get("sourceFile") as File | null;

  if (!studentName) errors.push("Student name is required");
  if (!subject || !VALID_SUBJECTS.includes(subject as Subject)) {
    errors.push("Please select a valid subject (Maths, English, or Science)");
  }
  if (!testName) errors.push("Test name is required");

  const percentage = Number(percentageRaw);
  if (percentageRaw === "" || isNaN(percentage)) {
    errors.push("Percentage score is required");
  } else if (percentage < 0 || percentage > 100) {
    errors.push("Percentage must be between 0 and 100");
  }

  const sourceText = sourceTextField;

  if (sourceFile && sourceFile.size > 0) {
    // File content is read in the API route since FormData file reading is async
  } else if (!sourceText) {
    errors.push("Please provide source text or upload a text file");
  }

  if (errors.length > 0) {
    return { input: {} as ReportInput, errors };
  }

  return {
    errors: [],
    input: {
      studentName: studentName!,
      subject: subject as Subject,
      testName: testName!,
      percentage,
      sourceText: sourceText ?? "",
    },
  };
}

export async function readSourceText(formData: FormData): Promise<string> {
  const sourceTextField = (formData.get("sourceText") as string)?.trim();
  const sourceFile = formData.get("sourceFile") as File | null;

  if (sourceFile && sourceFile.size > 0) {
    return await sourceFile.text();
  }

  return sourceTextField ?? "";
}
