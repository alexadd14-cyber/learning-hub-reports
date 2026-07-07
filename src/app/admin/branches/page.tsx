import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export default async function BranchesPage() {
  const branches = await db.branch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
      users: true,
    },
  });

  async function createBranch(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
    const slug = String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!name || !contactEmail || !slug) return;

    await db.branch.create({
      data: {
        name,
        contactEmail,
        slug,
      },
    });
    revalidatePath("/admin/branches");
  }

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Create branch</h2>
        <form action={createBranch} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input name="name" placeholder="Branch name" className="rounded border border-purple-200 px-3 py-2" required />
          <input name="slug" placeholder="branch-slug" className="rounded border border-purple-200 px-3 py-2" required />
          <input name="contactEmail" type="email" placeholder="contact@branch.com" className="rounded border border-purple-200 px-3 py-2" required />
          <button className="rounded bg-purple-700 px-4 py-2 text-white sm:col-span-3" type="submit">
            Create branch
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Branches</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Subscription</th>
                <th className="px-2 py-2">Users</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => {
                const latest = branch.subscriptions[0];
                return (
                  <tr key={branch.id} className="border-t border-gray-100">
                    <td className="px-2 py-2">{branch.name}</td>
                    <td className="px-2 py-2">{branch.slug}</td>
                    <td className="px-2 py-2">
                      {latest ? `${latest.plan.name} (${latest.status})` : "Not assigned"}
                    </td>
                    <td className="px-2 py-2">{branch.users.length}</td>
                    <td className="px-2 py-2">{branch.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-2 py-2">
                      <Link href={`/admin/branches/${branch.id}`} className="text-purple-700 underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
