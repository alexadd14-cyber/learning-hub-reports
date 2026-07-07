import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const subscriptionId = String(body.subscriptionId ?? "");
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { branch: true, plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    const stripe = getStripe();
    const sessionUrlBase = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${sessionUrlBase}/admin/subscriptions?checkout=success`,
      cancel_url: `${sessionUrlBase}/admin/subscriptions?checkout=cancelled`,
      customer_email: subscription.branch.contactEmail,
      metadata: {
        subscriptionId: subscription.id,
        branchId: subscription.branchId,
        planId: subscription.planId,
      },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            recurring: { interval: "month" },
            unit_amount: subscription.plan.priceMonthly ?? 0,
            product_data: {
              name: `${subscription.plan.name} plan`,
            },
          },
          quantity: 1,
        },
      ],
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Failed to create Stripe checkout session:", error);
    return NextResponse.json(
      { error: "Stripe checkout is not configured yet." },
      { status: 500 }
    );
  }
}
