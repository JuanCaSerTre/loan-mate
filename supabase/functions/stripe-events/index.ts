import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe signature", {
        headers: corsHeaders,
        status: 400,
      });
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different Stripe events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (!session.customer || !session.subscription) {
    console.log("Skipping: No customer or subscription in session");
    return;
  }

  const customerId = typeof session.customer === "string" 
    ? session.customer 
    : session.customer.id;
  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  // Get the subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find user by stripe_customer_id
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("User not found:", userError);
    return;
  }

  // Update user with subscription info
  const { error: updateError } = await supabase
    .from("users")
    .update({
      is_premium: true,
      subscription_id: subscriptionId,
      subscription_status: subscription.status,
      subscription_expiry: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating user:", updateError);
  } else {
    console.log(`User ${user.id} subscription activated`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("User not found:", userError);
    return;
  }

  // Update subscription status
  const { error: updateError } = await supabase
    .from("users")
    .update({
      subscription_status: subscription.status,
      subscription_expiry: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating subscription:", updateError);
  } else {
    console.log(`User ${user.id} subscription updated: ${subscription.status}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (userError || !user) {
    console.error("User not found:", userError);
    return;
  }

  // Cancel subscription
  const { error: updateError } = await supabase
    .from("users")
    .update({
      is_premium: false,
      subscription_status: "canceled",
      subscription_id: null,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error canceling subscription:", updateError);
  } else {
    console.log(`User ${user.id} subscription canceled`);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Invoice ${invoice.id} payment succeeded`);
  // Add any custom logic here (e.g., send email, update records)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice ${invoice.id} payment failed`);
  // Add any custom logic here (e.g., send notification, mark subscription at risk)
}
