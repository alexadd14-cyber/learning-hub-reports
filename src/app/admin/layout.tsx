import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <div>
          <h1 className="text-xl font-bold text-purple-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Subscription and branch management</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded bg-purple-100 px-3 py-1.5 text-purple-800" href="/admin">
            Overview
          </Link>
          <Link className="rounded bg-purple-100 px-3 py-1.5 text-purple-800" href="/admin/branches">
            Branches
          </Link>
          <Link className="rounded bg-purple-100 px-3 py-1.5 text-purple-800" href="/admin/plans">
            Plans
          </Link>
          <Link className="rounded bg-purple-100 px-3 py-1.5 text-purple-800" href="/admin/subscriptions">
            Subscriptions
          </Link>
          <Link className="rounded bg-purple-100 px-3 py-1.5 text-purple-800" href="/">
            App
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
