import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;

async function stripeRequest(endpoint: string, method: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch user subscription data
    const { data: user, error } = await supabase
      .from("users")
      .select("is_premium, stripe_customer_id, subscription_status, subscription_id, subscription_expiry, subscription_plan")
      .eq("id", user_id)
      .single();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check if subscription has expired (local check)
    let isPremium = user.is_premium ?? false;
    let subscriptionStatus = user.subscription_status ?? "free";

    if (user.subscription_expiry) {
      const expiry = new Date(user.subscription_expiry);
      const now = new Date();

      if (expiry < now && isPremium) {
        // Verify with Stripe if we have a subscription_id
        if (user.subscription_id) {
          const stripeSub = await stripeRequest(
            `/subscriptions/${user.subscription_id}`,
            "GET"
          );

          if (stripeSub.status !== "active" && stripeSub.status !== "trialing") {
            // Subscription really expired — downgrade
            isPremium = false;
            subscriptionStatus = "canceled";

            await supabase
              .from("users")
              .update({
                is_premium: false,
                subscription_status: "canceled",
                subscription_plan: null,
              })
              .eq("id", user_id);
          } else {
            // Stripe says still active — update local expiry
            const newExpiry = new Date(
              stripeSub.current_period_end * 1000
            ).toISOString();
            isPremium = true;
            subscriptionStatus = "active";

            await supabase
              .from("users")
              .update({
                is_premium: true,
                subscription_status: "active",
                subscription_expiry: newExpiry,
              })
              .eq("id", user_id);
          }
        } else {
          // No subscription_id but marked premium and expired — downgrade
          isPremium = false;
          subscriptionStatus = "free";

          await supabase
            .from("users")
            .update({
              is_premium: false,
              subscription_status: "free",
            })
            .eq("id", user_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        is_premium: isPremium,
        subscription_status: subscriptionStatus,
        subscription_plan: user.subscription_plan,
        subscription_expiry: user.subscription_expiry,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
