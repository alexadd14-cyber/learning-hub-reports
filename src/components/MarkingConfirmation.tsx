"use client";

import type { CatalogAssessment } from "@/types/catalog";
import {
  formatMarkOption,
  markOptions,
  marksToPerformance,
} from "@/types/report";
import type { VisionAnalysisResult } from "@/types/vision";

interface MarkingConfirmationProps {
  assessment: CatalogAssessment;
  visionResult: VisionAnalysisResult;
  marks: number[];
  onMarkChange: (index: number, value: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

function confidenceBadge(confidence: string) {
  const styles: Record<string, string> = {
    high: "bg-green-100 text-green-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${styles[confidence] ?? styles.low}`}
    >
      {confidence}
    </span>
  );
}

export default function MarkingConfirmation({
  assessment,
  visionResult,
  marks,
  onMarkChange,
  onApply,
  onCancel,
}: MarkingConfirmationProps) {
  const lowConfidenceCount = visionResult.questions.filter(
    (question) => question.confidence === "low"
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Review detected marks
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Check each question below. Adjust any marks before applying them to
            the form.
          </p>
          {visionResult.overallNotes && (
            <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {visionResult.overallNotes}
            </p>
          )}
          {lowConfidenceCount > 0 && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {lowConfidenceCount} question
              {lowConfidenceCount === 1 ? "" : "s"} had low confidence — please
              verify carefully.
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-100 px-6">
          {assessment.questions.map((question, index) => {
            const visionQ = visionResult.questions[index];
            const maxMarks = question.maxMarks ?? 1;
            const awarded = marks[index] ?? 0;
            const performance = marksToPerformance(awarded, maxMarks);

            return (
              <div key={index} className="flex items-start gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      Q{index + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.skillArea}
                    </span>
                    {visionQ && confidenceBadge(visionQ.confidence)}
                  </div>
                  {visionQ?.observation && (
                    <p className="mt-1 text-xs text-gray-500">
                      {visionQ.observation}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">{performance}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={awarded}
                    onChange={(event) =>
                      onMarkChange(index, Number(event.target.value))
                    }
                    className="rounded-md border border-purple-200 px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {markOptions(maxMarks).map((option) => (
                      <option key={option} value={option}>
                        {formatMarkOption(option)}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">/ {maxMarks}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
          >
            Apply marks to form
          </button>
        </div>
      </div>
    </div>
  );
}
