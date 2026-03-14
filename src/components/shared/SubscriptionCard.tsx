/**
 * JUCA — SubscriptionCard
 * Shows subscription status, billing date, and cancel option in the profile screen.
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
  CalendarClock,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { SUBSCRIPTION } from "@/config/constants";
import type { SubscriptionInfo } from "@/services/subscriptionService";
import { useState } from "react";

interface SubscriptionCardProps {
  isPremium: boolean;
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  activeLoansCount: number;
  onUpgrade: () => void;
  onManage: () => void;
  onCancel?: () => Promise<boolean>;
  onRefresh?: () => Promise<void>;
}

export default function SubscriptionCard({
  isPremium,
  subscription,
  isLoading,
  activeLoansCount,
  onUpgrade,
  onManage,
  onCancel,
  onRefresh,
}: SubscriptionCardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const daysUntilExpiry = expiry
    ? Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isCanceled = status === "canceled";
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  const statusBadge = {
    free: { label: "Free Plan", color: "bg-gray-100 text-gray-600" },
    active: { label: "Premium Active", color: "bg-emerald-50 text-emerald-600" },
    trialing: { label: "Trial", color: "bg-blue-50 text-blue-600" },
    past_due: { label: "Payment Due", color: "bg-amber-50 text-amber-600" },
    canceled: { label: "Canceled", color: "bg-red-50 text-red-500" },
  }[status] ?? { label: "Free Plan", color: "bg-gray-100 text-gray-600" };

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsCancelling(true);
    try {
      const success = await onCancel();
      if (success) {
        setShowCancelConfirm(false);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // ─── Premium card (active or canceled-but-still-has-access) ────
  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1B2E4B] to-[#2A4365] rounded-2xl shadow-sm overflow-hidden relative"
      >
        {/* Decorative sparkle */}
        <div className="absolute top-3 right-3 opacity-20">
          <Sparkles className="w-16 h-16 text-amber-400" />
        </div>

        <div className="p-4 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold">JUCA Premium</h3>
                <span
                  className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge.color}`}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-white/60 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            )}
          </div>

          {/* Subscription details */}
          <div className="space-y-1.5 mb-3">
            {plan && (
              <div className="flex justify-between">
                <span className="text-white/50 text-xs">Plan</span>
                <span className="text-white text-xs font-semibold capitalize">
                  {plan} — $
                  {plan === "yearly"
                    ? SUBSCRIPTION.YEARLY_PRICE + "/yr"
                    : SUBSCRIPTION.MONTHLY_PRICE + "/mo"}
                </span>
              </div>
            )}

            {/* Next billing / access until date */}
            {formattedExpiry && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  {isCanceled ? "Access until" : "Next billing"}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isCanceled
                      ? "text-amber-300"
                      : isExpiringSoon
                      ? "text-amber-300"
                      : "text-white"
                  }`}
                >
                  {formattedExpiry}
                </span>
              </div>
            )}

            {/* Days remaining for canceled */}
            {isCanceled && daysUntilExpiry !== null && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Time remaining
                </span>
                <span
                  className={`text-xs font-semibold ${
                    daysUntilExpiry <= 3 ? "text-red-400" : "text-amber-300"
                  }`}
                >
                  {daysUntilExpiry === 0
                    ? "Expires today"
                    : daysUntilExpiry === 1
                    ? "1 day left"
                    : `${daysUntilExpiry} days left`}
                </span>
              </div>
            )}

            {/* Status detail */}
            {status === "past_due" && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Payment
                </span>
                <span className="text-amber-300 text-xs font-semibold">
                  Action required
                </span>
              </div>
            )}
          </div>

          {/* Cancellation warning banner */}
          {isCanceled && (
            <div className="bg-amber-400/15 rounded-xl px-3 py-2.5 border border-amber-400/20 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 text-[11px] font-semibold">
                    Subscription canceled
                  </p>
                  <p className="text-amber-200/60 text-[10px] mt-0.5">
                    You'll keep premium access until {formattedExpiry}. After
                    that, your account will return to the free plan (
                    {SUBSCRIPTION.FREE_LOAN_LIMIT} active loans).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {isCanceled ? (
              <>
                {/* Resubscribe via billing portal */}
                <button
                  onClick={onManage}
                  className="w-full h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Resubscribe
                </button>
                <button
                  onClick={onManage}
                  className="w-full h-9 rounded-xl bg-white/10 border border-white/10 text-white/60 text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Billing Portal
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onManage}
                  className="w-full h-9 rounded-xl bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Manage Subscription
                </button>

                {/* Cancel button */}
                {onCancel && !showCancelConfirm && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full h-8 rounded-xl text-white/30 text-[11px] font-medium flex items-center justify-center gap-1.5 hover:text-white/50 transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                    Cancel Subscription
                  </button>
                )}
              </>
            )}
          </div>

          {/* Cancel confirmation dialog */}
          <AnimatePresence>
            {showCancelConfirm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-red-500/15 rounded-xl p-3.5 border border-red-400/20">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-300 text-xs font-semibold">
                        Cancel your subscription?
                      </p>
                      <p className="text-red-200/60 text-[10px] mt-1">
                        You'll keep premium access until your current billing
                        period ends
                        {formattedExpiry ? ` (${formattedExpiry})` : ""}.
                        After that, you'll be downgraded to the free plan with
                        a limit of {SUBSCRIPTION.FREE_LOAN_LIMIT} active loans.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={isCancelling}
                      className="flex-1 h-8 rounded-lg bg-white/10 text-white/70 text-[11px] font-semibold active:scale-[0.98] transition-all"
                    >
                      Keep Premium
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex-1 h-8 rounded-lg bg-red-500/30 border border-red-400/30 text-red-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {isCancelling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Yes, Cancel
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // ─── Free plan card ────────────────────────────────────────────
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
                {activeLoansCount} of {SUBSCRIPTION.FREE_LOAN_LIMIT} active
                loans used
              </p>
            </div>
          </div>
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusBadge.color}`}
          >
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

        {/* Free plan features */}
        <div className="space-y-1.5 mb-2">
          {SUBSCRIPTION.FEATURES.FREE.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <span className="text-gray-500 text-[11px]">{feature}</span>
            </div>
          ))}
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
