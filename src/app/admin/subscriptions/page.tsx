import { revalidatePath } from "next/cache";
import { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";

export default async function SubscriptionsPage() {
  const [subscriptions, branches, plans] = await Promise.all([
    db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { branch: true, plan: true },
    }),
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.plan.findMany({ orderBy: { name: "asc" } }),
  ]);

  async function createSubscription(formData: FormData) {
    "use server";
    const branchId = String(formData.get("branchId") ?? "");
    const planId = String(formData.get("planId") ?? "");
    const status = String(formData.get("status") ?? "trial") as SubscriptionStatus;
    if (!branchId || !planId) return;

    await db.subscription.create({
      data: {
        branchId,
        planId,
        status,
        startsAt: new Date(),
      },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/branches");
  }

  async function updateSubscription(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const planId = String(formData.get("planId"));
    const status = String(formData.get("status")) as SubscriptionStatus;
    const stripeCustomerIdRaw = String(formData.get("stripeCustomerId") ?? "").trim();
    const stripeSubscriptionIdRaw = String(
      formData.get("stripeSubscriptionId") ?? ""
    ).trim();

    await db.subscription.update({
      where: { id },
      data: {
        planId,
        status,
        stripeCustomerId: stripeCustomerIdRaw || null,
        stripeSubscriptionId: stripeSubscriptionIdRaw || null,
      },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/branches");
  }

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Assign subscription</h2>
        <form action={createSubscription} className="mt-4 grid gap-3 sm:grid-cols-3">
          <select name="branchId" className="rounded border border-purple-200 px-3 py-2" required>
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select name="planId" className="rounded border border-purple-200 px-3 py-2" required>
            <option value="">Select plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
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
          <button className="rounded bg-purple-700 px-4 py-2 text-white sm:col-span-3" type="submit">
            Assign
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Subscriptions</h2>
        <div className="mt-4 space-y-3">
          {subscriptions.map((subscription) => (
            <form
              key={subscription.id}
              action={updateSubscription}
              className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-5"
            >
              <input type="hidden" name="id" value={subscription.id} />
              <p className="text-sm font-medium text-gray-800">
                {subscription.branch.name}
              </p>
              <select name="planId" defaultValue={subscription.planId} className="rounded border border-purple-200 px-2 py-1.5 text-sm">
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <select name="status" defaultValue={subscription.status} className="rounded border border-purple-200 px-2 py-1.5 text-sm">
                <option value="trial">trial</option>
                <option value="active">active</option>
                <option value="past_due">past_due</option>
                <option value="suspended">suspended</option>
                <option value="cancelled">cancelled</option>
              </select>
              <input
                name="stripeCustomerId"
                defaultValue={subscription.stripeCustomerId ?? ""}
                placeholder="stripeCustomerId"
                className="rounded border border-purple-200 px-2 py-1.5 text-sm"
              />
              <input
                name="stripeSubscriptionId"
                defaultValue={subscription.stripeSubscriptionId ?? ""}
                placeholder="stripeSubscriptionId"
                className="rounded border border-purple-200 px-2 py-1.5 text-sm"
              />
              <button className="rounded bg-purple-700 px-3 py-1.5 text-sm text-white sm:col-span-5" type="submit">
                Save
              </button>
            </form>
          ))}
        </div>
      </article>
    </section>
  );
}
