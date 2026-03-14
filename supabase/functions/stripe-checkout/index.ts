import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { user_id, plan, success_url, cancel_url } = await req.json();

    if (!user_id || !plan) {
      return new Response(
        JSON.stringify({ error: "user_id and plan are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch user from DB
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, phone_number, stripe_customer_id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
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
      stripeCustomerId = customer.id;

      // Save stripe_customer_id to DB
      await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    // Determine price ID
    const MONTHLY_PRICE_ID = Deno.env.get("STRIPE_MONTHLY_PRICE_ID");
    const YEARLY_PRICE_ID = Deno.env.get("STRIPE_YEARLY_PRICE_ID");
    const priceId = plan === "yearly" ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Price ID not configured for selected plan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Build the app return URL
    const appUrl = success_url || "https://fd4ab35a-3c76-4b74-96be-8b04ba2b3fba.canvases.tempo.build";
    const cancelAppUrl = cancel_url || appUrl;

    // Create Stripe Checkout Session
    const session = await stripeRequest("/checkout/sessions", "POST", {
      customer: stripeCustomerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${appUrl}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelAppUrl}?subscription=canceled`,
      "metadata[user_id]": user.id,
      "subscription_data[metadata][user_id]": user.id,
    });

    if (session.error) {
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
