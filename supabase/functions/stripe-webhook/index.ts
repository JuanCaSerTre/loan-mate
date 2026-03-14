import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;

async function stripeRequest(
  endpoint: string,
  method: string,
  body?: Record<string, string>
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const options: RequestInit = { method, headers };
  if (body) {
    options.body = new URLSearchParams(body).toString();
  }

  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  return res.json();
}

async function updateUserSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);

  if (error) {
    console.error(`[stripe-webhook] Failed to update user ${userId}:`, error);
  }
}

async function findUserByStripeCustomer(
  supabase: ReturnType<typeof createClient>,
  customerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  return data?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.text();
    
    // Parse the event — in production, verify the signature
    const event = JSON.parse(body);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(`[stripe-webhook] Processing event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const subscriptionId = session.subscription;

        if (userId && subscriptionId) {
          // Fetch subscription details from Stripe
          const subscription = await stripeRequest(
            `/subscriptions/${subscriptionId}`,
            "GET"
          );

          const currentPeriodEnd = new Date(
            subscription.current_period_end * 1000
          ).toISOString();

          // Determine plan type from interval
          const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
          const plan = interval === "year" ? "yearly" : "monthly";

          await updateUserSubscription(supabase, userId, {
            is_premium: true,
            subscription_status: "active",
            subscription_id: subscriptionId,
            subscription_expiry: currentPeriodEnd,
            subscription_plan: plan,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId =
          subscription.metadata?.user_id ??
          (await findUserByStripeCustomer(
            supabase,
            subscription.customer
          ));

        if (userId) {
          const currentPeriodEnd = new Date(
            subscription.current_period_end * 1000
          ).toISOString();

          const status = subscription.status;
          const isPremium = status === "active" || status === "trialing";

          const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
          const plan = interval === "year" ? "yearly" : "monthly";

          await updateUserSubscription(supabase, userId, {
            is_premium: isPremium,
            subscription_status: status === "active" ? "active" : status === "trialing" ? "trialing" : status === "past_due" ? "past_due" : "canceled",
            subscription_expiry: currentPeriodEnd,
            subscription_plan: plan,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId =
          subscription.metadata?.user_id ??
          (await findUserByStripeCustomer(
            supabase,
            subscription.customer
          ));

        if (userId) {
          await updateUserSubscription(supabase, userId, {
            is_premium: false,
            subscription_status: "canceled",
            subscription_id: null,
            subscription_plan: null,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripeRequest(
            `/subscriptions/${subscriptionId}`,
            "GET"
          );

          const userId =
            subscription.metadata?.user_id ??
            (await findUserByStripeCustomer(
              supabase,
              invoice.customer
            ));

          if (userId) {
            await updateUserSubscription(supabase, userId, {
              subscription_status: "past_due",
            });
          }
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[stripe-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
