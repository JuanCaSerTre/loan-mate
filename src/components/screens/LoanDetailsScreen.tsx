import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check, X, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { Payment } from "@/types/loan";
import { useState } from "react";

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
    navigate,
    currentUser,
    updatePaymentStatus,
    updateLoanStatus,
    addNotification,
    selectLoan,
  } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);

  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;
  if (!loan) return null;

  const payments = getPaymentsForLoan(loan.loan_id);
  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const confirmedAmount = confirmedPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = loan.total_amount - confirmedAmount;
  const progress = Math.min((confirmedAmount / loan.total_amount) * 100, 100);

  const isLender = loan.lender_id === currentUser?.id;
  const counterparty = isLender ? loan.borrower_name : loan.lender_name;
  const counterpartyAvatar = isLender ? loan.borrower_avatar : loan.lender_avatar;

  const statusColors = {
    pending: "bg-[#FFB347]/10 text-[#FFB347] border-[#FFB347]/20",
    active: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/20",
    completed: "bg-white/5 text-white/50 border-white/10",
    declined: "bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/20",
  };

  const handleConfirmPayment = (payment: Payment) => {
    updatePaymentStatus(payment.payment_id, "confirmed");
    addNotification({
      id: `notif_${Date.now()}`,
      type: "payment_confirmed",
      title: "Payment Confirmed",
      message: `You confirmed a payment of $${payment.amount.toLocaleString()} on loan with ${isLender ? counterparty : loan.lender_name}`,
      loan_id: loan.loan_id,
      payment_id: payment.payment_id,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Check if all payments confirmed
    const updatedConfirmed = payments.filter((p) => p.status === "confirmed" || p.payment_id === payment.payment_id);
    if (updatedConfirmed.length >= loan.number_of_payments) {
      setTimeout(() => {
        updateLoanStatus(loan.loan_id, "completed");
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }, 500);
    }
  };

  const handleRejectPayment = (payment: Payment) => {
    updatePaymentStatus(payment.payment_id, "rejected");
    addNotification({
      id: `notif_${Date.now()}`,
      type: "payment_rejected",
      title: "Payment Rejected",
      message: `You rejected a payment of $${payment.amount.toLocaleString()}`,
      loan_id: loan.loan_id,
      payment_id: payment.payment_id,
      read: false,
      created_at: new Date().toISOString(),
    });
  };

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
          <div>
            <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {isLender ? "Borrower" : "Lender"}
            </p>
            <p className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              {counterparty}
            </p>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#1A2B3C] border border-white/5 rounded-3xl p-4 space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Original</p>
              <p className="text-white font-black text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${loan.loan_amount.toLocaleString()}</p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Total</p>
              <p className="text-white font-black text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${loan.total_amount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Remaining</p>
              <p className="text-[#FFB347] font-black text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${remaining.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <span>{confirmedPayments.length} of {loan.number_of_payments} payments</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#00C9A7] to-[#00C9A7]/70"
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-white/30 pt-1">
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Started {new Date(loan.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span style={{ fontFamily: "'Manrope', sans-serif" }}>Due {new Date(loan.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </motion.div>

        {/* Payment Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-white font-bold text-sm mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Payment Timeline</h3>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 bg-[#1A2B3C]/50 rounded-2xl border border-white/5">
              <span className="text-2xl">💳</span>
              <p className="text-white/30 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>No payments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment, idx) => {
                const s = statusIcons[payment.status];
                const Icon = s.icon;
                const canConfirm = payment.status === "pending_confirmation" && !isLender;
                return (
                  <motion.div
                    key={payment.payment_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                    className={`flex items-center gap-3 bg-[#1A2B3C] border rounded-2xl p-3.5 ${s.border}`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          ${payment.amount.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase ${s.color}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-white/30 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                          {new Date(payment.payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        {payment.note && (
                          <span className="text-white/20 text-xs">· {payment.note}</span>
                        )}
                      </div>
                    </div>
                    {canConfirm && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRejectPayment(payment)}
                          className="w-8 h-8 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-[#FF6B6B]" />
                        </button>
                        <button
                          onClick={() => handleConfirmPayment(payment)}
                          className="w-8 h-8 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-[#00C9A7]" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* CTA for lender */}
      {isLender && loan.status === "active" && (
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
