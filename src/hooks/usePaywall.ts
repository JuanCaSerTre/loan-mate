/**
 * LoanMate — usePaywall Hook
 * Centralized paywall logic that determines when to show upgrade prompts
 * and provides contextual messaging for different trigger scenarios.
 */
import { useState, useCallback, useMemo } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import type { User, Loan } from "@/types/loan";

export type PaywallTrigger = "loan_limit" | "export_report" | null;

interface PaywallConfig {
  trigger: PaywallTrigger;
  title: string;
  subtitle: string;
  emoji: string;
  featureHighlight: string;
}

const PAYWALL_CONFIGS: Record<Exclude<PaywallTrigger, null>, PaywallConfig> = {
  loan_limit: {
    trigger: "loan_limit",
    title: "Unlock Unlimited Loans",
    subtitle: "You've reached the free plan limit. Upgrade to keep tracking all your loans without restrictions.",
    emoji: "🔓",
    featureHighlight: "Unlimited active loans",
  },
  export_report: {
    trigger: "export_report",
    title: "Export Loan Reports",
    subtitle: "Download detailed PDF & CSV reports of your loans and payment history. A premium-only feature.",
    emoji: "📊",
    featureHighlight: "Loan export reports (PDF & CSV)",
  },
};

interface UsePaywallReturn {
  /** Whether the paywall modal is currently showing */
  isPaywallOpen: boolean;
  /** The current paywall trigger reason */
  paywallTrigger: PaywallTrigger;
  /** The config for the current paywall trigger */
  paywallConfig: PaywallConfig | null;
  /** Open the paywall for a specific trigger */
  showPaywall: (trigger: Exclude<PaywallTrigger, null>) => void;
  /** Close the paywall */
  closePaywall: () => void;
  /** Check if the user can create a loan (or should see paywall) */
  guardCreateLoan: () => boolean;
  /** Check if the user can export (or should see paywall) */
  guardExport: () => boolean;
  /** Whether user is premium */
  isPremium: boolean;
  /** Subscription hook utilities */
  startCheckout: (plan: "monthly" | "yearly") => Promise<void>;
  isCheckoutLoading: boolean;
  activeLoansCount: number;
  hasReachedFreeLimit: boolean;
  remainingFreeLoans: number;
  canCreateLoan: boolean;
}

export function usePaywall(
  currentUser: User | null,
  loans: Loan[]
): UsePaywallReturn {
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger>(null);

  const subscription = useSubscription(currentUser, loans);

  const paywallConfig = useMemo(() => {
    if (!paywallTrigger) return null;
    return PAYWALL_CONFIGS[paywallTrigger];
  }, [paywallTrigger]);

  const showPaywall = useCallback((trigger: Exclude<PaywallTrigger, null>) => {
    setPaywallTrigger(trigger);
    setIsPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    // Clear trigger after animation
    setTimeout(() => setPaywallTrigger(null), 300);
  }, []);

  const guardCreateLoan = useCallback((): boolean => {
    if (subscription.canCreateLoan) return true;
    showPaywall("loan_limit");
    return false;
  }, [subscription.canCreateLoan, showPaywall]);

  const guardExport = useCallback((): boolean => {
    if (subscription.isPremium) return true;
    showPaywall("export_report");
    return false;
  }, [subscription.isPremium, showPaywall]);

  return {
    isPaywallOpen,
    paywallTrigger,
    paywallConfig,
    showPaywall,
    closePaywall,
    guardCreateLoan,
    guardExport,
    isPremium: subscription.isPremium,
    startCheckout: subscription.startCheckout,
    isCheckoutLoading: subscription.isCheckoutLoading,
    activeLoansCount: subscription.activeLoansCount,
    hasReachedFreeLimit: subscription.hasReachedFreeLimit,
    remainingFreeLoans: subscription.remainingFreeLoans,
    canCreateLoan: subscription.canCreateLoan,
  };
}
