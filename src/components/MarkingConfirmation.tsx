"use client";

import type { CatalogAssessment } from "@/types/catalog";
import type { QuestionPerformance } from "@/types/report";
import { PERFORMANCE_OPTIONS } from "@/types/report";
import type { VisionAnalysisResult, VisionConfidence } from "@/types/vision";

interface MarkingConfirmationProps {
  assessment: CatalogAssessment;
  photoPreview: string;
  result: VisionAnalysisResult;
  performances: QuestionPerformance[];
  onPerformanceChange: (index: number, value: QuestionPerformance) => void;
  onConfirm: () => void;
  onDiscard: () => void;
}

function confidenceBadge(confidence: VisionConfidence) {
  const styles: Record<VisionConfidence, string> = {
    high: "bg-green-100 text-green-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[confidence]}`}
    >
      {confidence}
    </span>
  );
}

export default function MarkingConfirmation({
  assessment,
  photoPreview,
  result,
  performances,
  onPerformanceChange,
  onConfirm,
  onDiscard,
}: MarkingConfirmationProps) {
  const observationByIndex = Object.fromEntries(
    result.questions.map((item) => [item.questionIndex, item])
  );

  return (
    <div className="rounded-xl border-2 border-purple-300 bg-white shadow-lg">
      <div className="border-b border-purple-100 bg-purple-50 px-4 py-3 sm:px-6">
        <h3 className="text-base font-semibold text-purple-900">
          Review suggested marks
        </h3>
        <p className="mt-1 text-sm text-purple-700">
          {result.testMatch
            ? "The photo appears to match this assessment. Check each suggestion against the image, adjust if needed, then confirm."
            : "The test could not be fully verified. Please check every mark carefully before confirming."}
        </p>
        {result.overallNotes && (
          <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm text-gray-600">
            {result.overallNotes}
          </p>
        )}
      </div>

      <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-600">
            Uploaded photo
          </p>
          <img
            src={photoPreview}
            alt="Marked test for review"
            className="max-h-80 w-full rounded-lg border border-purple-200 object-contain"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-600">
            Suggested performance
          </p>
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {assessment.questions.map((question, index) => {
              const visionItem = observationByIndex[index];
              const needsReview =
                visionItem?.confidence === "low" ||
                visionItem?.confidence === "medium";

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 ${
                    needsReview
                      ? "border-amber-200 bg-amber-50"
                      : "border-purple-100 bg-purple-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        Q{index + 1} — {question.skillArea}
                      </p>
                      {visionItem?.observation && (
                        <p className="mt-1 text-xs text-gray-600">
                          {visionItem.observation}
                        </p>
                      )}
                    </div>
                    {visionItem && confidenceBadge(visionItem.confidence)}
                  </div>
                  <select
                    value={performances[index] ?? ""}
                    onChange={(e) =>
                      onPerformanceChange(
                        index,
                        e.target.value as QuestionPerformance
                      )
                    }
                    className="mt-2 block w-full rounded-md border border-purple-200 bg-white px-2 py-1.5 text-sm"
                  >
                    {PERFORMANCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-purple-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Discard suggestions
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-purple-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-800"
        >
          Confirm marks
        </button>
      </div>
    </div>
  );
}
