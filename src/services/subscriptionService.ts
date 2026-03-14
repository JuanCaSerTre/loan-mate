/**
 * LoanMate — Subscription Service
 * Handles Stripe checkout, subscription checking, and management via Supabase Edge Functions.
 */
import { supabase } from "@/lib/supabase";
import type { SubscriptionStatus, SubscriptionPlan } from "@/types/loan";

export interface SubscriptionInfo {
  is_premium: boolean;
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_expiry?: string;
}

class SubscriptionService {
  /**
   * Create a Stripe Checkout session and return the checkout URL.
   */
  async createCheckout(
    userId: string,
    plan: "monthly" | "yearly"
  ): Promise<{ checkout_url: string; session_id: string } | null> {
    try {
      const appUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            user_id: userId,
            plan,
            success_url: appUrl,
            cancel_url: appUrl,
          },
        }
      );

      if (error) {
        console.error("[subscriptionService] createCheckout error:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("[subscriptionService] createCheckout exception:", err);
      return null;
    }
  }

  /**
   * Check the current subscription status for a user (validates with Stripe if expired).
   */
  async checkSubscription(userId: string): Promise<SubscriptionInfo | null> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-check-subscription",
        {
          body: { user_id: userId },
        }
      );

      if (error) {
        console.error("[subscriptionService] checkSubscription error:", error);
        return null;
      }

      return {
        is_premium: data.is_premium ?? false,
        subscription_status: data.subscription_status ?? "free",
        subscription_plan: data.subscription_plan ?? undefined,
        subscription_expiry: data.subscription_expiry ?? undefined,
      };
    } catch (err) {
      console.error("[subscriptionService] checkSubscription exception:", err);
      return null;
    }
  }

  /**
   * Open the Stripe Billing Portal so the user can manage their subscription.
   */
  async openBillingPortal(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-manage-subscription",
        {
          body: {
            user_id: userId,
            action: "portal",
            return_url: window.location.origin,
          },
        }
      );

      if (error) {
        console.error("[subscriptionService] portal error:", error);
        return null;
      }

      return data.portal_url ?? null;
    } catch (err) {
      console.error("[subscriptionService] portal exception:", err);
      return null;
    }
  }

  /**
   * Cancel the subscription at the end of the current billing period.
   */
  async cancelSubscription(
    userId: string
  ): Promise<{ success: boolean; cancel_at?: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-manage-subscription",
        {
          body: {
            user_id: userId,
            action: "cancel",
          },
        }
      );

      if (error) {
        console.error("[subscriptionService] cancel error:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("[subscriptionService] cancel exception:", err);
      return null;
    }
  }

  /**
   * Read subscription data directly from the users table (local, no Stripe check).
   */
  async getLocalSubscription(userId: string): Promise<SubscriptionInfo | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "is_premium, subscription_status, subscription_plan, subscription_expiry"
        )
        .eq("id", userId)
        .single();

      if (error || !data) return null;

      return {
        is_premium: data.is_premium ?? false,
        subscription_status: (data.subscription_status as SubscriptionStatus) ?? "free",
        subscription_plan: (data.subscription_plan as SubscriptionPlan) ?? undefined,
        subscription_expiry: data.subscription_expiry ?? undefined,
      };
    } catch (err) {
      console.error("[subscriptionService] getLocal exception:", err);
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default SubscriptionService;
