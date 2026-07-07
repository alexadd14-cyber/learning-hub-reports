import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export default async function PlansPage() {
  const plans = await db.plan.findMany({ orderBy: { createdAt: "asc" } });

  async function createPlan(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const reportsInput = String(formData.get("reportsPerMonth") ?? "").trim();
    const maxSeats = Number(formData.get("maxSeats") ?? 1);
    const priceInput = String(formData.get("priceMonthly") ?? "").trim();
    const visionEnabled = String(formData.get("visionEnabled")) === "on";

    if (!name || Number.isNaN(maxSeats) || maxSeats < 1) return;

    await db.plan.create({
      data: {
        name,
        reportsPerMonth: reportsInput ? Number(reportsInput) : null,
        maxSeats,
        priceMonthly: priceInput ? Number(priceInput) : null,
        visionEnabled,
      },
    });
    revalidatePath("/admin/plans");
  }

  async function updatePlan(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const reportsInput = String(formData.get("reportsPerMonth") ?? "").trim();
    const priceInput = String(formData.get("priceMonthly") ?? "").trim();
    await db.plan.update({
      where: { id },
      data: {
        name: String(formData.get("name") ?? "").trim(),
        reportsPerMonth: reportsInput ? Number(reportsInput) : null,
        maxSeats: Number(formData.get("maxSeats") ?? 1),
        priceMonthly: priceInput ? Number(priceInput) : null,
        visionEnabled: String(formData.get("visionEnabled")) === "on",
      },
    });
    revalidatePath("/admin/plans");
  }

  return (
    <section className="space-y-6">
      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Create plan</h2>
        <form action={createPlan} className="mt-4 grid gap-3 sm:grid-cols-5">
          <input name="name" placeholder="Plan name" className="rounded border border-purple-200 px-3 py-2" required />
          <input name="reportsPerMonth" placeholder="Reports/month (blank unlimited)" className="rounded border border-purple-200 px-3 py-2" />
          <input name="maxSeats" type="number" min={1} defaultValue={1} className="rounded border border-purple-200 px-3 py-2" />
          <input name="priceMonthly" type="number" min={0} placeholder="Price monthly (cents)" className="rounded border border-purple-200 px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input name="visionEnabled" type="checkbox" />
            Vision enabled
          </label>
          <button className="rounded bg-purple-700 px-4 py-2 text-white sm:col-span-5" type="submit">
            Create plan
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-purple-900">Plans</h2>
        <div className="mt-4 space-y-3">
          {plans.map((plan) => (
            <form key={plan.id} action={updatePlan} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-6">
              <input type="hidden" name="id" value={plan.id} />
              <input name="name" defaultValue={plan.name} className="rounded border border-purple-200 px-2 py-1.5" />
              <input
                name="reportsPerMonth"
                defaultValue={plan.reportsPerMonth ?? ""}
                className="rounded border border-purple-200 px-2 py-1.5"
              />
              <input name="maxSeats" type="number" min={1} defaultValue={plan.maxSeats} className="rounded border border-purple-200 px-2 py-1.5" />
              <input
                name="priceMonthly"
                type="number"
                min={0}
                defaultValue={plan.priceMonthly ?? ""}
                className="rounded border border-purple-200 px-2 py-1.5"
              />
              <label className="flex items-center gap-2 text-sm">
                <input name="visionEnabled" type="checkbox" defaultChecked={plan.visionEnabled} />
                Vision
              </label>
              <button className="rounded bg-purple-700 px-3 py-1.5 text-white sm:col-span-6" type="submit">
                Save
              </button>
            </form>
          ))}
        </div>
      </article>
    </section>
  );
}
