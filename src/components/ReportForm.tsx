"use client";

import { useState, useRef } from "react";
import type { Subject } from "@/types/report";

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: "maths", label: "Mathematics" },
  { value: "english", label: "English" },
  { value: "science", label: "Science" },
];

export default function ReportForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate report");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "Student_Report.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-purple-900">
            Student Name
          </label>
          <input
            id="studentName"
            name="studentName"
            type="text"
            required
            placeholder="e.g. Emma Thompson"
            className="mt-1 block w-full rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-purple-900">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            defaultValue=""
            className="mt-1 block w-full rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="" disabled>
              Select a subject
            </option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="testName" className="block text-sm font-medium text-purple-900">
            Test Completed
          </label>
          <input
            id="testName"
            name="testName"
            type="text"
            required
            placeholder="e.g. Term 2 Algebra Assessment"
            className="mt-1 block w-full rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div>
          <label htmlFor="percentage" className="block text-sm font-medium text-purple-900">
            Percentage Score
          </label>
          <div className="relative mt-1">
            <input
              id="percentage"
              name="percentage"
              type="number"
              min={0}
              max={100}
              step={0.1}
              required
              placeholder="e.g. 78"
              className="block w-full rounded-lg border border-purple-200 bg-white px-4 py-2.5 pr-10 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              %
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-medium text-purple-900">
            Source Notes for Report
          </label>
          <div className="flex rounded-lg border border-purple-200 bg-purple-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                inputMode === "text"
                  ? "bg-white text-purple-800 shadow-sm"
                  : "text-purple-600 hover:text-purple-800"
              }`}
            >
              Type notes
            </button>
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                inputMode === "file"
                  ? "bg-white text-purple-800 shadow-sm"
                  : "text-purple-600 hover:text-purple-800"
              }`}
            >
              Upload file
            </button>
          </div>
        </div>

        {inputMode === "text" ? (
          <textarea
            id="sourceText"
            name="sourceText"
            rows={6}
            placeholder="Paste tutor notes here — topics covered, question breakdown, observations, etc."
            className="block w-full rounded-lg border border-purple-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        ) : (
          <div>
            <input
              id="sourceFile"
              name="sourceFile"
              type="file"
              accept=".txt,.text"
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-purple-800"
            />
            <p className="mt-2 text-xs text-purple-600">
              Upload a plain text (.txt) file with tutor notes
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating report…
          </span>
        ) : (
          "Generate PDF Report"
        )}
      </button>
    </form>
  );
}
