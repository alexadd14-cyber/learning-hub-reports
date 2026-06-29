export type Subject = "maths" | "english" | "science";

export interface ReportInput {
  studentName: string;
  subject: Subject;
  testName: string;
  percentage: number;
  sourceText: string;
}

export interface GeneratedReport {
  introduction: string;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  closing: string;
}

export interface ReportData extends ReportInput {
  report: GeneratedReport;
  generatedAt: string;
}
