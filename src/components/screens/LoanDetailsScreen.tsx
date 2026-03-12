import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check, X, Clock, DollarSign, Wallet, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { Payment } from "@/types/loan";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const statusIcons = {
  confirmed: { icon: Check, color: "text-[#00C9A7]", bg: "bg-[#00C9A7]/10", border: "border-[#00C9A7]/20", label: "Confirmed" },
  pending_confirmation: { icon: Clock, color: "text-[#FFB347]", bg: "bg-[#FFB347]/10", border: "border-[#FFB347]/20", label: "Pending" },
  rejected: { icon: X, color: "text-[#FF6B6B]", bg: "bg-[#FF6B6B]/10", border: "border-[#FF6B6B]/20", label: "Rejected" },
};

export default function LoanDetailsScreen() {
  const {
    selectedLoanId,
    getLoanById,
    getPaymentsForLoan,
    getLoanComputed,
    navigate,
    currentUser,
    confirmPayment,
    rejectPayment,
    selectLoan,
  } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;
  const loanStatus = loan?.status ?? null;

  // Detect completion for celebration animation
  useEffect(() => {
    if (loanStatus === "completed" && prevStatusRef.current === "active") {
      const t1 = setTimeout(() => {
        setShowCelebration(true);
        const t2 = setTimeout(() => setShowCelebration(false), 3000);
        return () => clearTimeout(t2);
      }, 300);
      return () => clearTimeout(t1);
    }
    prevStatusRef.current = loanStatus;
  }, [loanStatus]);

  if (!loan) return null;

  const payments = getPaymentsForLoan(loan.loan_id);
  const computed = getLoanComputed(loan.loan_id);
  const { confirmedPayments, confirmedAmount, remainingBalance, progress, scheduledPaymentAmount } = computed;

  const isLender = loan.lender_id === currentUser?.id;
  const counterparty = isLender ? loan.borrower_name : loan.lender_name;
  const counterpartyAvatar = isLender ? loan.borrower_avatar : loan.lender_avatar;

  // Determine who can confirm: the party who did NOT register the payment
  const canUserConfirm = (payment: Payment) => {
    return payment.status === "pending_confirmation" && payment.created_by_user !== currentUser?.id;
  };

  const statusColors = {
    pending: "bg-[#FFB347]/10 text-[#FFB347] border-[#FFB347]/20",
    active: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/20",
    completed: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/20",
    declined: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20",
  };

  const handleConfirmPayment = (payment: Payment) => {
    setConfirmingPaymentId(payment.payment_id);
    setTimeout(() => {
      confirmPayment(payment.payment_id);
      setConfirmingPaymentId(null);
      toast.success("Payment confirmed!", {
        description: `$${payment.amount.toLocaleString()} has been confirmed`,
        style: {
          background: "#1A2B3C",
          border: "1px solid rgba(0,201,167,0.3)",
          color: "#fff",
        },
      });
    }, 400);
  };

  const handleRejectPayment = (payment: Payment) => {
    rejectPayment(payment.payment_id);
    toast.error("Payment rejected", {
      description: `$${payment.amount.toLocaleString()} payment was rejected`,
      style: {
        background: "#1A2B3C",
        border: "1px solid rgba(255,107,107,0.3)",
        color: "#fff",
      },
    });
  };

  const pendingPayments = payments.filter((p) => p.status === "pending_confirmation");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  return (
    <div className="relative flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D1B2A]/90 backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
              className="text-7xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-4xl font-black text-[#00C9A7] mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Loan Complete!
            </h2>
            <p className="text-white/60 text-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
              All payments confirmed 🎊
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate("loans")} className="w-10 h-10 rounded-2xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <h2 className="text-white font-bold text-base flex-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Loan Details
        </h2>
        <div className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${statusColors[loan.status]}`}>
          {loan.status}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {/* Counterparty */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#1A2B3C] border border-white/5 rounded-3xl p-4"
        >
          <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="lg" />
          <div className="flex-1">
            <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {isLender ? "Borrower" : "Lender"}
            </p>
            <p className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              {counterparty}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {loan.payment_frequency}
            </p>
            <p className="text-white/50 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {loan.interest_rate > 0 ? `${loan.interest_rate}% interest` : "No interest"}
            </p>
          </div>
        </motion.div>

        {/* Financial Summary - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#1A2B3C] border border-white/5 rounded-3xl p-4 space-y-4"
        >
          {/* Big financial stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Amount Owed */}
            <div className="relative bg-[#0D1B2A]/60 rounded-2xl p-3 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white opacity-[0.02] -translate-y-4 translate-x-4 blur-xl" />
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-white/30" />
                <p className="text-white/40 text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Total Owed</p>
              </div>
              <p className="text-white font-black text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${loan.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              {loan.interest_rate > 0 && (
                <p className="text-white/20 text-[10px] mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Principal: ${loan.loan_amount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Total Paid */}
            <div className="relative bg-[#00C9A7]/5 rounded-2xl p-3 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-[#00C9A7] opacity-[0.05] -translate-y-4 translate-x-4 blur-xl" />
              <div className="flex items-center gap-1.5 mb-1">
                <Check className="w-3 h-3 text-[#00C9A7]/50" />
                <p className="text-[#00C9A7]/60 text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Total Paid</p>
              </div>
              <p className="text-[#00C9A7] font-black text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[#00C9A7]/30 text-[10px] mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {confirmedPayments.length} payment{confirmedPayments.length !== 1 ? "s" : ""} confirmed
              </p>
            </div>
          </div>

          {/* Remaining Balance - Highlighted */}
          <div className="relative bg-gradient-to-r from-[#FFB347]/10 to-[#FFB347]/5 rounded-2xl p-3 border border-[#FFB347]/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#FFB347] opacity-[0.05] -translate-y-4 translate-x-4 blur-xl" />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3 h-3 text-[#FFB347]/60" />
                  <p className="text-[#FFB347]/60 text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Remaining Balance</p>
                </div>
                <p className="text-[#FFB347] font-black text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[10px]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Per payment
                </p>
                <p className="text-white/60 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${scheduledPaymentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <span>{confirmedPayments.length} of {loan.number_of_payments} payments</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  progress === 100
                    ? "bg-gradient-to-r from-[#00C9A7] to-[#00E5BD]"
                    : "bg-gradient-to-r from-[#00C9A7] to-[#00C9A7]/70"
                }`}
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-white/30 pt-1">
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Started {new Date(loan.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Due {new Date(loan.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </motion.div>

        {/* Pending Confirmations Alert */}
        {pendingPayments.length > 0 && canUserConfirm(pendingPayments[0]) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-3 bg-[#FFB347]/10 border border-[#FFB347]/20 rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFB347]/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#FFB347]" />
            </div>
            <div className="flex-1">
              <p className="text-[#FFB347] text-sm font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {pendingPayments.filter((p) => canUserConfirm(p)).length} payment{pendingPayments.filter((p) => canUserConfirm(p)).length > 1 ? "s" : ""} awaiting your confirmation
              </p>
              <p className="text-[#FFB347]/50 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Review and confirm below
              </p>
            </div>
          </motion.div>
        )}

        {/* Payment Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Payment History</h3>
            <span className="text-white/30 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {payments.length} transaction{payments.length !== 1 ? "s" : ""}
            </span>
          </div>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 bg-[#1A2B3C]/50 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/30 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>No payments recorded yet</p>
              <p className="text-white/20 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {isLender ? "Record a payment when received" : "Payments will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment, idx) => {
                const s = statusIcons[payment.status];
                const Icon = s.icon;
                const userCanConfirm = canUserConfirm(payment);
                const isConfirming = confirmingPaymentId === payment.payment_id;
                const registeredByUser = payment.created_by_user === currentUser?.id;
                return (
                  <motion.div
                    key={payment.payment_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isConfirming ? 0.5 : 1, x: 0, scale: isConfirming ? 0.98 : 1 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                    className={`bg-[#1A2B3C] border rounded-2xl overflow-hidden ${s.border}`}
                  >
                    <div className="flex items-center gap-3 p-3.5">
                      <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            ${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase ${s.color} px-1.5 py-0.5 rounded-md ${s.bg}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-white/30 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                            {new Date(payment.payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <span className="text-white/15 text-[10px]">·</span>
                          <span className="text-white/20 text-[10px]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                            {registeredByUser ? "You registered" : `${counterparty} registered`}
                          </span>
                        </div>
                        {payment.note && (
                          <p className="text-white/20 text-xs mt-1 italic" style={{ fontFamily: "'Manrope', sans-serif" }}>
                            "{payment.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Confirm/Reject action bar */}
                    {userCanConfirm && (
                      <div className="flex border-t border-white/5">
                        <button
                          onClick={() => handleRejectPayment(payment)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[#FF6B6B] hover:bg-[#FF6B6B]/5 active:bg-[#FF6B6B]/10 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>Reject</span>
                        </button>
                        <div className="w-px bg-white/5" />
                        <button
                          onClick={() => handleConfirmPayment(payment)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[#00C9A7] hover:bg-[#00C9A7]/5 active:bg-[#00C9A7]/10 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>Confirm</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Payment Summary Stats */}
        {payments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A2B3C]/50 border border-white/5 rounded-2xl p-4"
          >
            <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Payment Summary
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Confirmed</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#00C9A7] text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-white/20 text-[10px]">({confirmedPayments.length})</span>
                </div>
              </div>
              {pendingPayments.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Pending</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FFB347] text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ${pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-white/20 text-[10px]">({pendingPayments.length})</span>
                  </div>
                </div>
              )}
              {rejectedPayments.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Rejected</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B6B] text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ${rejectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-white/20 text-[10px]">({rejectedPayments.length})</span>
                  </div>
                </div>
              )}
              <div className="border-t border-white/5 pt-2 mt-1 flex items-center justify-between">
                <span className="text-white/50 text-xs font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>Still to pay</span>
                <span className="text-white font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* CTA - Register Payment (both lender and borrower can register) */}
      {loan.status === "active" && remainingBalance > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-5 pb-6"
        >
          <button
            onClick={() => {
              selectLoan(loan.loan_id);
              navigate("register-payment");
            }}
            className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#00C9A7]/20"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Register Payment
          </button>
        </motion.div>
      )}
    </div>
  );
}
