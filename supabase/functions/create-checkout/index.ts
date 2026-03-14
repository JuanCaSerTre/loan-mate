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

const MONTHLY_PRICE_ID = Deno.env.get("STRIPE_MONTHLY_PRICE_ID")!;
const YEARLY_PRICE_ID = Deno.env.get("STRIPE_YEARLY_PRICE_ID")!;

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
    const { user_id, plan, success_url, cancel_url } = await req.json();

    if (!user_id || !plan) {
      return new Response(
        JSON.stringify({ error: "user_id and plan are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (plan !== "monthly" && plan !== "yearly") {
      return new Response(
        JSON.stringify({ error: "plan must be 'monthly' or 'yearly'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, phone_number, stripe_customer_id")
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

    // Create or reuse Stripe customer
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripeRequest("/customers", "POST", {
        name: user.name,
        phone: user.phone_number,
        "metadata[user_id]": user.id,
      });

      if (customer.error) {
        throw new Error(customer.error.message);
      }

      stripeCustomerId = customer.id;

      // Save Stripe customer ID to user
      await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user_id);
    }

    // Select the price based on the plan
    const priceId = plan === "yearly" ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;

    const appUrl = success_url || "https://loanmate.app";
    const cancelAppUrl = cancel_url || appUrl;

    // Create Stripe Checkout Session
    const session = await stripeRequest("/checkout/sessions", "POST", {
      customer: stripeCustomerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${appUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelAppUrl}?checkout=canceled`,
      "metadata[user_id]": user_id,
      "metadata[plan]": plan,
      "subscription_data[metadata][user_id]": user_id,
      allow_promotion_codes: "true",
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[create-checkout] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
