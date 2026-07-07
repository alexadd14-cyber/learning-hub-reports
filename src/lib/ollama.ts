import type { GeneratedReport, ReportInput } from "@/types/report";
import type { CatalogAssessmentRef } from "@/types/catalog";
import { getSubjectLabel } from "@/lib/brand";
import { getOllamaConfig, ollamaChat, parseJsonContent } from "@/lib/ollama-client";

interface ReportGenerationContext extends ReportInput {
  assessmentRef: CatalogAssessmentRef;
  recordedScore: number;
  maxScore: number;
  percentage: number;
}

function buildPrompt(context: ReportGenerationContext): string {
  const { book, assessment } = context.assessmentRef;
  const subjectLabel = getSubjectLabel(book.subject);

  const questionSummary = context.questionMarks
    .map((mark, index) => {
      const skill = assessment.questions[index]?.skillArea ?? "Unknown";
      return `Q${index + 1} (${skill}): ${mark.performance}`;
    })
    .join("\n");

  const notesBlock = context.tutorNotes?.trim()
    ? `\nAdditional tutor notes:\n---\n${context.tutorNotes}\n---\n`
    : "";

  return `You are writing a formal student progress report for "The Learning Hub" tuition centre.

Student: ${context.studentName}
Book: ${book.name}
Chapter: ${assessment.chapter}
Assessment: ${assessment.title}
Subject: ${subjectLabel}
Score: ${context.recordedScore}/${context.maxScore} (${context.percentage}%)

Question results:
${questionSummary}
${notesBlock}
Write a personalised, encouraging but honest report. Use the student's first name where natural.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "summaryText": "2-3 sentence overview of overall performance",
  "whatWentWell": ["bullet 1", "bullet 2", "bullet 3"],
  "areasForImprovement": ["bullet 1", "bullet 2", "bullet 3"],
  "nextSteps": ["bullet 1", "bullet 2"],
  "questions": [
    {
      "label": "Q1",
      "skillArea": "exact skill from input",
      "performance": "exact performance from input",
      "comment": "1 short personalised comment for this question"
    }
  ],
  "finalTeacherComment": "2-3 sentence closing teacher comment"
}

Rules:
- Include exactly one entry in "questions" for each question listed above, in order (Q1, Q2, ...).
- Keep skillArea and performance exactly as given in the question results.
- British English spelling. Professional tone for parents.
- Comments should reflect whether the question was correct, incorrect, or partially correct.`;
}

function validateReport(
  parsed: GeneratedReport,
  expectedQuestionCount: number
): GeneratedReport {
  if (!parsed.summaryText || !parsed.finalTeacherComment) {
    throw new Error("Invalid report structure: missing summary or teacher comment");
  }

  const listFields = [
    ["whatWentWell", 3],
    ["areasForImprovement", 3],
    ["nextSteps", 2],
  ] as const;

  for (const [field, count] of listFields) {
    if (!Array.isArray(parsed[field]) || parsed[field].length !== count) {
      throw new Error(`Invalid report structure: ${field} must have ${count} items`);
    }
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length !== expectedQuestionCount) {
    throw new Error(
      `Invalid report structure: expected ${expectedQuestionCount} question rows`
    );
  }

  return parsed;
}

function buildFallbackReport(
  context: ReportGenerationContext
): GeneratedReport {
  const { book, assessment } = context.assessmentRef;
  const firstName = context.studentName.split(" ")[0];

  const questions = context.questionMarks.map((mark, index) => ({
    label: `Q${index + 1}`,
    skillArea: assessment.questions[index]?.skillArea ?? "",
    performance: mark.performance,
    comment:
      mark.performance === "Correct"
        ? `${firstName} answered this question well.`
        : mark.performance === "Partially correct"
          ? `${firstName} showed some understanding but needs further practice.`
          : `${firstName} should revisit this skill area with support.`,
  }));

  const correctCount = context.questionMarks.filter(
    (mark) => mark.performance === "Correct"
  ).length;

  return {
    summaryText: `${firstName} completed ${assessment.title} in ${book.name}, scoring ${context.recordedScore} out of ${context.maxScore} (${context.percentage}%).`,
    whatWentWell: [
      `${firstName} completed the full assessment.`,
      `Strongest areas included ${correctCount} fully correct response${correctCount === 1 ? "" : "s"}.`,
      `${firstName} engaged well with the ${getSubjectLabel(book.subject)} tasks.`,
    ],
    areasForImprovement: [
      "Review questions where marks were lost.",
      "Practise skill areas marked as incorrect or partially correct.",
      "Check work carefully before finishing each section.",
    ],
    nextSteps: [
      "Revisit incorrect questions with guided support at home.",
      "Complete follow-up practice on the weakest skill areas.",
    ],
    questions,
    finalTeacherComment: `${firstName} should be proud of their effort on this assessment. With continued practice on the areas identified above, further progress is expected next lesson.`,
  };
}

export async function generateReportText(
  context: ReportGenerationContext
): Promise<GeneratedReport> {
  const expectedQuestionCount = context.assessmentRef.assessment.questions.length;
  const { apiKey, textModel } = getOllamaConfig();

  if (!apiKey) {
    return buildFallbackReport(context);
  }

  try {
    const content = await ollamaChat({
      model: textModel,
      prompt: buildPrompt(context),
      json: true,
    });

    const parsed = parseJsonContent<GeneratedReport>(content);
    return validateReport(parsed, expectedQuestionCount);
  } catch {
    return buildFallbackReport(context);
  }
}

export type { ReportGenerationContext };
