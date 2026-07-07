import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const signature = (await headers()).get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
    }

    const rawBody = await request.text();
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const status = mapStripeStatus(subscription.status);
      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status,
          endsAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000)
            : null,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 400 });
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return SubscriptionStatus.trial;
    case "active":
      return SubscriptionStatus.active;
    case "past_due":
    case "unpaid":
      return SubscriptionStatus.past_due;
    case "canceled":
    case "incomplete_expired":
      return SubscriptionStatus.cancelled;
    default:
      return SubscriptionStatus.suspended;
  }
}
