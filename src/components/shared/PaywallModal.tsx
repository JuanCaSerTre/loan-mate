/**
 * LoanMate — PaywallModal
 * A contextual, friendly premium upgrade modal that adapts its messaging
 * based on the trigger scenario (loan limit, export report, etc.).
 * Non-intrusive but clearly communicates the value of upgrading.
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  X,
  Check,
  Zap,
  Shield,
  FileText,
  Headphones,
  Lock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SUBSCRIPTION } from "@/config/constants";
import { useState } from "react";
import type { PaywallTrigger } from "@/hooks/usePaywall";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: "monthly" | "yearly") => Promise<void>;
  isLoading?: boolean;
  trigger: PaywallTrigger;
  activeLoansCount?: number;
}

// Contextual header config per trigger
const TRIGGER_HEADERS: Record<
  Exclude<PaywallTrigger, null>,
  {
    emoji: string;
    title: string;
    subtitle: string;
    badgeText: string;
    badgeColor: string;
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  loan_limit: {
    emoji: "🔒",
    title: "You've Reached the Limit",
    subtitle:
      "Free plan allows up to 3 active loans. Upgrade to Premium for unlimited loans and more.",
    badgeText: "FREE LIMIT REACHED",
    badgeColor: "bg-amber-400/15 border-amber-400/20 text-amber-200",
    gradientFrom: "from-[#1B2E4B]",
    gradientTo: "to-[#2A4365]",
  },
  export_report: {
    emoji: "📊",
    title: "Export Loan Reports",
    subtitle:
      "Download detailed reports of your loans and payments in PDF or CSV format. A Premium feature.",
    badgeText: "PREMIUM FEATURE",
    badgeColor: "bg-purple-400/15 border-purple-400/20 text-purple-200",
    gradientFrom: "from-[#2D1B4E]",
    gradientTo: "to-[#1B2E4B]",
  },
};

const premiumFeatures = [
  {
    icon: Zap,
    label: "Unlimited active loans",
    desc: "No restrictions on how many loans you track",
    highlight: "loan_limit" as const,
  },
  {
    icon: FileText,
    label: "Loan export reports",
    desc: "Download PDF & CSV reports anytime",
    highlight: "export_report" as const,
  },
  {
    icon: TrendingUp,
    label: "Advanced payment reminders",
    desc: "Smart scheduling for on-time payments",
    highlight: null,
  },
  {
    icon: Headphones,
    label: "Priority support",
    desc: "Fast response when you need help",
    highlight: null,
  },
];

export default function PaywallModal({
  isOpen,
  onClose,
  onUpgrade,
  isLoading = false,
  trigger,
  activeLoansCount = 0,
}: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly"
  );

  if (!trigger) return null;

  const header = TRIGGER_HEADERS[trigger];

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
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header gradient — context-aware */}
            <div
              className={`bg-gradient-to-br ${header.gradientFrom} ${header.gradientTo} px-5 pt-4 pb-5`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      delay: 0.15,
                    }}
                    className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl"
                  >
                    {header.emoji}
                  </motion.div>
                  <div>
                    <h2 className="text-white text-lg font-bold leading-tight">
                      {header.title}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Contextual message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-xl px-3.5 py-2.5 border ${header.badgeColor}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Lock className="w-3 h-3" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    {header.badgeText}
                  </p>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  {header.subtitle}
                </p>
                {trigger === "loan_limit" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{
                          width: `${Math.min(100, (activeLoansCount / SUBSCRIPTION.FREE_LOAN_LIMIT) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-white/40 text-[10px] font-mono">
                      {activeLoansCount}/{SUBSCRIPTION.FREE_LOAN_LIMIT}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="px-5 py-4 overflow-y-auto max-h-[55vh] space-y-4">
              {/* What you'll unlock */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                    What you'll unlock
                  </p>
                </div>
                {premiumFeatures.map((f) => {
                  const Icon = f.icon;
                  const isHighlighted = f.highlight === trigger;
                  return (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: isHighlighted ? 0.1 : 0.2 }}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all ${
                        isHighlighted
                          ? "bg-[#1B2E4B]/[0.06] border border-[#1B2E4B]/10 ring-1 ring-[#1B2E4B]/5"
                          : "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isHighlighted
                            ? "bg-[#1B2E4B] shadow-sm"
                            : "bg-[#1B2E4B]/10"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isHighlighted ? "text-white" : "text-[#1B2E4B]"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-xs font-semibold ${
                              isHighlighted
                                ? "text-[#1B2E4B]"
                                : "text-gray-900"
                            }`}
                          >
                            {f.label}
                          </p>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded-full uppercase">
                              Needed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-[10px]">{f.desc}</p>
                      </div>
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          isHighlighted
                            ? "text-[#1B2E4B]"
                            : "text-gray-300"
                        }`}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Plan selector */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-2 gap-3"
              >
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
                  <p
                    className="text-gray-900 text-xl font-bold mt-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
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
                  <span className="absolute -top-2.5 right-2.5 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                    SAVE {SUBSCRIPTION.YEARLY_SAVINGS_PERCENT}%
                  </span>
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                    Yearly
                  </p>
                  <p
                    className="text-gray-900 text-xl font-bold mt-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    ${SUBSCRIPTION.YEARLY_PRICE}
                  </p>
                  <p className="text-gray-400 text-[10px]">/year</p>
                  {selectedPlan === "yearly" && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1B2E4B] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 py-1"
              >
                <div className="flex -space-x-2">
                  {["🧑", "👩", "👨", "🧑‍🦱"].map((emoji, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs ring-2 ring-white"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-[10px]">
                  Trusted by thousands of users
                </p>
              </motion.div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-6 pt-3 bg-white border-t border-gray-100">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => onUpgrade(selectedPlan)}
                disabled={isLoading}
                className="w-full h-12 rounded-2xl bg-[#1B2E4B] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-[#1B2E4B]/20"
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
              </motion.button>

              <button
                onClick={onClose}
                className="w-full py-2 mt-2 text-gray-400 text-xs font-medium hover:text-gray-500 transition-colors"
              >
                Maybe later
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Shield className="w-3 h-3 text-gray-300" />
                <p className="text-gray-300 text-[10px]">
                  Cancel anytime · Secure payment via Stripe
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
