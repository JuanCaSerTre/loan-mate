/**
 * LoanMate — UpgradePrompt
 * A modal/sheet that appears when a free user hits the 3-loan limit.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Check, Zap, Shield, FileText, Headphones } from "lucide-react";
import { SUBSCRIPTION } from "@/config/constants";
import { useState } from "react";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: "monthly" | "yearly") => Promise<void>;
  isLoading?: boolean;
  activeLoansCount: number;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  onUpgrade,
  isLoading = false,
  activeLoansCount,
}: UpgradePromptProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  const premiumFeatures = [
    { icon: Zap, label: "Unlimited active loans", desc: "No restrictions" },
    { icon: Crown, label: "Advanced payment reminders", desc: "Smart scheduling" },
    { icon: FileText, label: "Loan export reports", desc: "PDF & CSV" },
    { icon: Headphones, label: "Priority support", desc: "Fast response" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-t-[28px] overflow-hidden max-h-[92vh]"
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-[#1B2E4B] to-[#2A4365] px-5 pt-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                    <Crown className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <h2 className="text-white text-lg font-bold">Go Premium</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Limit message */}
              <div className="bg-amber-400/15 rounded-xl px-3.5 py-2.5 border border-amber-400/20">
                <p className="text-amber-200 text-xs font-semibold">
                  🔒 You've reached the free plan limit
                </p>
                <p className="text-amber-200/60 text-[11px] mt-0.5">
                  {activeLoansCount} of {SUBSCRIPTION.FREE_LOAN_LIMIT} active loans used. Upgrade to create unlimited loans.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Plan selector */}
              <div className="grid grid-cols-2 gap-3">
                {/* Monthly */}
                <button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`relative rounded-2xl border-2 p-3.5 text-left transition-all ${
                    selectedPlan === "monthly"
                      ? "border-[#1B2E4B] bg-[#1B2E4B]/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                    Monthly
                  </p>
                  <p className="text-gray-900 text-xl font-bold mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ${SUBSCRIPTION.MONTHLY_PRICE}
                  </p>
                  <p className="text-gray-400 text-[10px]">/month</p>
                  {selectedPlan === "monthly" && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1B2E4B] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                {/* Yearly */}
                <button
                  onClick={() => setSelectedPlan("yearly")}
                  className={`relative rounded-2xl border-2 p-3.5 text-left transition-all ${
                    selectedPlan === "yearly"
                      ? "border-[#1B2E4B] bg-[#1B2E4B]/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Savings badge */}
                  <span className="absolute -top-2.5 right-2.5 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                    SAVE {SUBSCRIPTION.YEARLY_SAVINGS_PERCENT}%
                  </span>
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                    Yearly
                  </p>
                  <p className="text-gray-900 text-xl font-bold mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ${SUBSCRIPTION.YEARLY_PRICE}
                  </p>
                  <p className="text-gray-400 text-[10px]">/year</p>
                  {selectedPlan === "yearly" && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1B2E4B] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Premium features */}
              <div className="space-y-2.5">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                  Premium includes
                </p>
                {premiumFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#1B2E4B]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#1B2E4B]" />
                      </div>
                      <div>
                        <p className="text-gray-900 text-xs font-semibold">
                          {f.label}
                        </p>
                        <p className="text-gray-400 text-[10px]">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-6 pt-3 bg-white border-t border-gray-100">
              <button
                onClick={() => onUpgrade(selectedPlan)}
                disabled={isLoading}
                className="w-full h-12 rounded-2xl bg-[#1B2E4B] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium — $
                    {selectedPlan === "yearly"
                      ? `${SUBSCRIPTION.YEARLY_PRICE}/yr`
                      : `${SUBSCRIPTION.MONTHLY_PRICE}/mo`}
                  </>
                )}
              </button>
              <p className="text-center text-gray-400 text-[10px] mt-2">
                Cancel anytime · Secure payment via Stripe
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
