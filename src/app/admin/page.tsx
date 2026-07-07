import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/subscription";

export default async function AdminPage() {
  const [branchCount, planCount, activeSubscriptions, usage] = await Promise.all([
    db.branch.count(),
    db.plan.count(),
    db.subscription.count({ where: { status: { in: ["active", "trial"] } } }),
    db.usageRecord.aggregate({
      where: { period: currentPeriod() },
      _sum: { reportsGenerated: true, visionCalls: true },
    }),
  ]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Branches" value={String(branchCount)} />
      <MetricCard label="Plans" value={String(planCount)} />
      <MetricCard label="Active/Trial subscriptions" value={String(activeSubscriptions)} />
      <MetricCard
        label={`Usage (${currentPeriod()})`}
        value={`${usage._sum.reportsGenerated ?? 0} reports / ${usage._sum.visionCalls ?? 0} vision`}
      />
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-purple-100 bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-purple-900">{value}</p>
    </article>
  );
}
