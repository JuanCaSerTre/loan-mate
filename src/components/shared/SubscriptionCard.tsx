/**
 * LoanMate — SubscriptionCard
 * Shows subscription status in the profile screen. Allows upgrade or manage.
 */
import { motion } from "framer-motion";
import { Crown, ChevronRight, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { SUBSCRIPTION } from "@/config/constants";
import type { SubscriptionInfo } from "@/services/subscriptionService";

interface SubscriptionCardProps {
  isPremium: boolean;
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  activeLoansCount: number;
  onUpgrade: () => void;
  onManage: () => void;
}

export default function SubscriptionCard({
  isPremium,
  subscription,
  isLoading,
  activeLoansCount,
  onUpgrade,
  onManage,
}: SubscriptionCardProps) {
  const status = subscription?.subscription_status ?? "free";
  const plan = subscription?.subscription_plan;
  const expiry = subscription?.subscription_expiry;

  const formattedExpiry = expiry
    ? new Date(expiry).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const statusBadge = {
    free: { label: "Free Plan", color: "bg-gray-100 text-gray-600" },
    active: { label: "Premium Active", color: "bg-emerald-50 text-emerald-600" },
    trialing: { label: "Trial", color: "bg-blue-50 text-blue-600" },
    past_due: { label: "Payment Due", color: "bg-amber-50 text-amber-600" },
    canceled: { label: "Canceled", color: "bg-red-50 text-red-500" },
  }[status] ?? { label: "Free Plan", color: "bg-gray-100 text-gray-600" };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1B2E4B] to-[#2A4365] rounded-2xl p-4 shadow-sm overflow-hidden relative"
      >
        {/* Decorative sparkle */}
        <div className="absolute top-3 right-3 opacity-20">
          <Sparkles className="w-16 h-16 text-amber-400" />
        </div>

        <div className="flex items-center gap-2 mb-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white text-sm font-bold">LoanMate Premium</h3>
            <span className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-1.5 mb-3">
          {plan && (
            <div className="flex justify-between">
              <span className="text-white/50 text-xs">Plan</span>
              <span className="text-white text-xs font-semibold capitalize">
                {plan} — ${plan === "yearly" ? SUBSCRIPTION.YEARLY_PRICE + "/yr" : SUBSCRIPTION.MONTHLY_PRICE + "/mo"}
              </span>
            </div>
          )}
          {formattedExpiry && (
            <div className="flex justify-between">
              <span className="text-white/50 text-xs">
                {status === "canceled" ? "Access until" : "Renews on"}
              </span>
              <span className="text-white text-xs font-semibold">
                {formattedExpiry}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onManage}
          className="w-full h-9 rounded-xl bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all relative z-10"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Manage Subscription
        </button>
      </motion.div>
    );
  }

  // Free plan card
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Crown className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <h3 className="text-gray-900 text-sm font-bold">Free Plan</h3>
              <p className="text-gray-400 text-[10px]">
                {activeLoansCount} of {SUBSCRIPTION.FREE_LOAN_LIMIT} active loans used
              </p>
            </div>
          </div>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Usage bar */}
        <div className="mt-2 mb-3">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeLoansCount >= SUBSCRIPTION.FREE_LOAN_LIMIT
                  ? "bg-amber-500"
                  : "bg-[#1B2E4B]"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (activeLoansCount / SUBSCRIPTION.FREE_LOAN_LIMIT) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Crown className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-gray-900 text-sm font-semibold">
            Upgrade to Premium
          </p>
          <p className="text-gray-400 text-[10px]">
            Unlimited loans · Starting at ${SUBSCRIPTION.MONTHLY_PRICE}/mo
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </button>
    </motion.div>
  );
}
