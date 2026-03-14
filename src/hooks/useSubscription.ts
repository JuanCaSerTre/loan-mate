/**
 * LoanMate — useSubscription Hook
 * Manages subscription state, premium checks, and checkout flows.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { subscriptionService } from "@/services/subscriptionService";
import type { SubscriptionInfo } from "@/services/subscriptionService";
import { SUBSCRIPTION } from "@/config/constants";
import type { User, Loan } from "@/types/loan";

interface UseSubscriptionReturn {
  /** Whether the user is a premium subscriber */
  isPremium: boolean;
  /** Current subscription info */
  subscription: SubscriptionInfo | null;
  /** Whether subscription data is loading */
  isLoading: boolean;
  /** Number of active loans the user currently has */
  activeLoansCount: number;
  /** Whether the user has hit the free loan limit */
  hasReachedFreeLimit: boolean;
  /** How many loans remaining on free plan */
  remainingFreeLoans: number;
  /** Whether the user can create a new loan */
  canCreateLoan: boolean;
  /** Initiate checkout for a plan */
  startCheckout: (plan: "monthly" | "yearly") => Promise<void>;
  /** Open billing portal */
  openBillingPortal: () => Promise<void>;
  /** Cancel subscription */
  cancelSubscription: () => Promise<boolean>;
  /** Refresh subscription from server */
  refreshSubscription: () => Promise<void>;
  /** Loading state for checkout */
  isCheckoutLoading: boolean;
}

export function useSubscription(
  currentUser: User | null,
  loans: Loan[]
): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Derive premium from user or subscription state
  const isPremium = useMemo(() => {
    if (subscription) return subscription.is_premium;
    return currentUser?.is_premium ?? false;
  }, [subscription, currentUser]);

  // Count active loans
  const activeLoansCount = useMemo(() => {
    if (!currentUser) return 0;
    return loans.filter(
      (l) =>
        (l.lender_id === currentUser.id || l.borrower_id === currentUser.id) &&
        (l.status === "active" || l.status === "pending")
    ).length;
  }, [loans, currentUser]);

  const hasReachedFreeLimit = !isPremium && activeLoansCount >= SUBSCRIPTION.FREE_LOAN_LIMIT;
  const remainingFreeLoans = isPremium
    ? Infinity
    : Math.max(0, SUBSCRIPTION.FREE_LOAN_LIMIT - activeLoansCount);
  const canCreateLoan = isPremium || activeLoansCount < SUBSCRIPTION.FREE_LOAN_LIMIT;

  // Fetch subscription on mount and when user changes
  const refreshSubscription = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const info = await subscriptionService.checkSubscription(currentUser.id);
      if (info) {
        setSubscription(info);
      }
    } catch (err) {
      console.error("[useSubscription] refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshSubscription();
    }
  }, [currentUser?.id, refreshSubscription]);

  // Check URL for checkout success on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      // Clear the URL params
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh subscription after a small delay to let webhook process
      setTimeout(() => {
        refreshSubscription();
      }, 2000);
    }
  }, [refreshSubscription]);

  const startCheckout = useCallback(
    async (plan: "monthly" | "yearly") => {
      if (!currentUser?.id) return;
      setIsCheckoutLoading(true);
      try {
        const result = await subscriptionService.createCheckout(
          currentUser.id,
          plan
        );
        if (result?.checkout_url) {
          window.open(result.checkout_url, "_blank");
        }
      } catch (err) {
        console.error("[useSubscription] checkout error:", err);
      } finally {
        setIsCheckoutLoading(false);
      }
    },
    [currentUser?.id]
  );

  const openBillingPortal = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const url = await subscriptionService.openBillingPortal(currentUser.id);
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("[useSubscription] portal error:", err);
    }
  }, [currentUser?.id]);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!currentUser?.id) return false;
    try {
      const result = await subscriptionService.cancelSubscription(currentUser.id);
      if (result?.success) {
        await refreshSubscription();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[useSubscription] cancel error:", err);
      return false;
    }
  }, [currentUser?.id, refreshSubscription]);

  return {
    isPremium,
    subscription,
    isLoading,
    activeLoansCount,
    hasReachedFreeLimit,
    remainingFreeLoans,
    canCreateLoan,
    startCheckout,
    openBillingPortal,
    cancelSubscription,
    refreshSubscription,
    isCheckoutLoading,
  };
}
