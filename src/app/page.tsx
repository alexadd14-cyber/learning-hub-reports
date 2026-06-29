import ReportForm from "@/components/ReportForm";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-700 shadow-lg">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-purple-900">
          The Learning Hub
        </h1>
        <p className="mt-2 text-lg text-purple-600">Student Report Generator</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
          Enter student details and tutor notes to generate a formal progress
          report as a branded PDF.
        </p>
      </header>

      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/50 sm:p-8">
        <ReportForm />
      </div>

      <footer className="mt-8 text-center text-xs text-purple-400">
        Reports are generated using tutor notes and AI-assisted writing.
      </footer>
    </main>
  );
}
