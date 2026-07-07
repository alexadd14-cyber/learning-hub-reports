import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SubscriptionStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [branch, plans] = await Promise.all([
    db.branch.findUnique({
      where: { id },
      include: {
        users: { orderBy: { createdAt: "desc" } },
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    db.plan.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!branch) notFound();

  async function updateBranch(formData: FormData) {
    "use server";
    const branchId = String(formData.get("branchId"));
    await db.branch.update({
      where: { id: branchId },
      data: {
        name: String(formData.get("name") ?? "").trim(),
        contactEmail: String(formData.get("contactEmail") ?? "").trim(),
        isActive: String(formData.get("isActive")) === "on",
      },
    });
    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");
  }

  async function addUser(formData: FormData) {
    "use server";
    const branchId = String(formData.get("branchId"));
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) return;

    await db.user.create({
      data: {
        email,
        name: name || null,
        branchId,
        role: UserRole.branch_user,
        passwordHash: await hash(password, 10),
      },
    });
    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");
  }

  async function addSubscription(formData: FormData) {
    "use server";
    const branchId = String(formData.get("branchId"));
    const planId = String(formData.get("planId"));
    const status = String(formData.get("status")) as SubscriptionStatus;
    if (!planId) return;

    await db.subscription.create({
      data: {
        branchId,
        planId,
        status,
        startsAt: new Date(),
      },
    });
    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");
    revalidatePath("/admin/subscriptions");
  }

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Branch details</h2>
        <form action={updateBranch} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="branchId" value={branch.id} />
          <input name="name" defaultValue={branch.name} className="rounded border border-purple-200 px-3 py-2" required />
          <input name="contactEmail" type="email" defaultValue={branch.contactEmail} className="rounded border border-purple-200 px-3 py-2" required />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input name="isActive" type="checkbox" defaultChecked={branch.isActive} />
            Branch is active
          </label>
          <button className="rounded bg-purple-700 px-4 py-2 text-white sm:col-span-3" type="submit">
            Save branch
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Create branch user</h2>
        <form action={addUser} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="branchId" value={branch.id} />
          <input name="name" placeholder="Tutor name" className="rounded border border-purple-200 px-3 py-2" />
          <input name="email" type="email" placeholder="tutor@branch.com" className="rounded border border-purple-200 px-3 py-2" required />
          <input name="password" type="text" placeholder="Temporary password" className="rounded border border-purple-200 px-3 py-2" required />
          <button className="rounded bg-purple-700 px-4 py-2 text-white sm:col-span-3" type="submit">
            Create user
          </button>
        </form>

        <ul className="mt-4 space-y-1 text-sm text-gray-700">
          {branch.users.map((user) => (
            <li key={user.id}>
              {user.email} ({user.role})
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Assign subscription</h2>
        <form action={addSubscription} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="branchId" value={branch.id} />
          <select name="planId" className="rounded border border-purple-200 px-3 py-2" required>
            <option value="">Select plan</option>
            {plans.map((plan) => (
              <option value={plan.id} key={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <select name="status" className="rounded border border-purple-200 px-3 py-2" defaultValue="trial">
            <option value="trial">trial</option>
            <option value="active">active</option>
            <option value="past_due">past_due</option>
            <option value="suspended">suspended</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button className="rounded bg-purple-700 px-4 py-2 text-white" type="submit">
            Assign plan
          </button>
        </form>

        <ul className="mt-4 space-y-1 text-sm text-gray-700">
          {branch.subscriptions.map((subscription) => (
            <li key={subscription.id}>
              {subscription.plan.name} - {subscription.status} (
              {subscription.startsAt.toISOString().slice(0, 10)})
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
