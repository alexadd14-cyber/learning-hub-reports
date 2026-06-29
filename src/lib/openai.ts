import OpenAI from "openai";
import type { GeneratedReport, ReportInput } from "@/types/report";

const SUBJECT_LABELS: Record<ReportInput["subject"], string> = {
  maths: "Mathematics",
  english: "English",
  science: "Science",
};

function buildPrompt(input: ReportInput): string {
  const subjectLabel = SUBJECT_LABELS[input.subject];

  return `You are writing a formal progress report for a student at "The Learning Hub" tuition centre.

Student details:
- Name: ${input.studentName}
- Subject: ${subjectLabel}
- Test: ${input.testName}
- Score: ${input.percentage}%

Source notes from the tutor (use these to inform your report):
---
${input.sourceText}
---

Write a personalised, encouraging but honest report. Always refer to the student by their first name where natural.

Respond with ONLY valid JSON in this exact structure (no markdown, no code fences):
{
  "introduction": "1-2 sentences opening the report",
  "strengths": "2-3 sentences on what the student did well, based on the source notes and score",
  "areasForImprovement": "2-3 sentences on areas to develop, framed constructively",
  "recommendations": "2-3 sentences with specific next steps for home or in class",
  "closing": "1-2 warm closing sentences"
}

Tone: professional, warm, suitable for parents. British English spelling.`;
}

export async function generateReportText(
  input: ReportInput
): Promise<GeneratedReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: buildPrompt(input) }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content) as GeneratedReport;

  const required: (keyof GeneratedReport)[] = [
    "introduction",
    "strengths",
    "areasForImprovement",
    "recommendations",
    "closing",
  ];

  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== "string") {
      throw new Error(`Invalid report structure: missing ${key}`);
    }
  }

  return parsed;
}

export function getSubjectLabel(subject: ReportInput["subject"]): string {
  return SUBJECT_LABELS[subject];
}

export function getScoreBand(percentage: number): string {
  if (percentage >= 90) return "Outstanding";
  if (percentage >= 80) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 60) return "Satisfactory";
  if (percentage >= 50) return "Developing";
  return "Needs Support";
}
