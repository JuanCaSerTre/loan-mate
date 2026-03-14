import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SERVICE_KEY")!;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { user_id, action, return_url } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, stripe_customer_id, subscription_id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    if (!user.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found for this user" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (action === "portal") {
      // Create a Stripe Billing Portal session
      const portalSession = await stripeRequest(
        "/billing_portal/sessions",
        "POST",
        {
          customer: user.stripe_customer_id,
          return_url: return_url || "https://juca.app",
        }
      );

      if (portalSession.error) {
        throw new Error(portalSession.error.message);
      }

      return new Response(
        JSON.stringify({ portal_url: portalSession.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "cancel") {
      if (!user.subscription_id) {
        return new Response(
          JSON.stringify({ error: "No active subscription" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Cancel at period end
      const subscription = await stripeRequest(
        `/subscriptions/${user.subscription_id}`,
        "POST",
        {
          cancel_at_period_end: "true",
        }
      );

      if (subscription.error) {
        throw new Error(subscription.error.message);
      }

      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      await supabase
        .from("users")
        .update({
          subscription_status: "canceled",
          subscription_expiry: periodEnd,
        })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription will be canceled at the end of the billing period",
          cancel_at: periodEnd,
          access_until: periodEnd,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'portal' or 'cancel'" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    console.error("[manage-subscription] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
