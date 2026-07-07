import ReportForm from "@/components/ReportForm";
import { SiteLogo } from "@/components/SiteLogo";
import { MOTTO } from "@/lib/brand";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { assertSubscriptionActive } from "@/lib/subscription";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let accessBlockedReason: string | null = null;
  let subscriptionSummary: string | null = null;

  if (!session?.user) {
    accessBlockedReason = "Please sign in to use the report generator.";
  } else if (session.user.role === "super_admin") {
    subscriptionSummary = "Signed in as HQ admin.";
  } else if (!session.user.branchId) {
    accessBlockedReason = "No branch is linked to this account. Contact HQ.";
  } else {
    try {
      const subscription = await assertSubscriptionActive(session.user.branchId);
      subscriptionSummary = `${subscription.plan.name} plan (${subscription.status})`;
    } catch (error) {
      accessBlockedReason =
        error instanceof Error
          ? error.message
          : "Your subscription is inactive. Please contact HQ.";
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-700 shadow-lg ring-4 ring-purple-100">
          <SiteLogo size={52} />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-600">
          {MOTTO.join(" · ")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-purple-900">
          The Learning Hub
        </h1>
        <p className="mt-2 text-lg text-purple-600">Student Report Generator</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
          Select an assessment, mark each question, and generate a formal
          two-page progress report.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-purple-700">
          {session?.user ? (
            <>
              <span className="rounded bg-purple-100 px-2 py-1">
                {session.user.email}
              </span>
              {subscriptionSummary ? (
                <span className="rounded bg-purple-100 px-2 py-1">
                  {subscriptionSummary}
                </span>
              ) : null}
              {session.user.role === "super_admin" ? (
                <Link href="/admin" className="rounded bg-purple-700 px-2 py-1 text-white">
                  Admin
                </Link>
              ) : null}
              <Link href="/api/auth/signout" className="rounded bg-white px-2 py-1 text-purple-700 border border-purple-200">
                Sign out
              </Link>
            </>
          ) : (
            <Link href="/login" className="rounded bg-purple-700 px-2 py-1 text-white">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/50 sm:p-8">
        <ReportForm accessBlockedReason={accessBlockedReason} />
      </div>

      <footer className="mt-8 text-center text-xs text-purple-400">
        Reports follow The Learning Hub standard template · {MOTTO.join(" · ")}
      </footer>
    </main>
  );
}
