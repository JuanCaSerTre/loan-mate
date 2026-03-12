import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check, X, Clock, DollarSign, Wallet, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { Payment } from "@/types/loan";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const statusIcons = {
  confirmed: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Confirmed" },
  pending_confirmation: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending" },
  rejected: { icon: X, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", label: "Rejected" },
};

export default function LoanDetailsScreen() {
  const {
    selectedLoanId, getLoanById, getPaymentsForLoan, getLoanComputed,
    navigate, currentUser, confirmPayment, rejectPayment, selectLoan,
  } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;
  const loanStatus = loan?.status ?? null;

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

  const canUserConfirm = (payment: Payment) => {
    return payment.status === "pending_confirmation" && payment.created_by_user !== currentUser?.id;
  };

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-500 border-red-200",
  };

  const handleConfirmPayment = (payment: Payment) => {
    setConfirmingPaymentId(payment.payment_id);
    setTimeout(() => {
      confirmPayment(payment.payment_id);
      setConfirmingPaymentId(null);
      toast.success("Payment confirmed!", {
        description: `$${payment.amount.toLocaleString()} has been confirmed`,
      });
    }, 400);
  };

  const handleRejectPayment = (payment: Payment) => {
    rejectPayment(payment.payment_id);
    toast.error("Payment rejected", {
      description: `$${payment.amount.toLocaleString()} payment was rejected`,
    });
  };

  const pendingPayments = payments.filter((p) => p.status === "pending_confirmation");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  return (
    <div className="relative flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: 3 }}
              className="text-7xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-3xl font-bold text-emerald-600 mb-2">
              Loan Complete!
            </h2>
            <p className="text-gray-500 text-center">
              All payments confirmed 🎊
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate("loans")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-gray-900 font-bold text-base flex-1">
          Loan Details
        </h2>
        <div className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${statusColors[loan.status]}`}>
          {loan.status}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">
        {/* Counterparty */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
        >
          <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="lg" />
          <div className="flex-1">
            <p className="text-gray-400 text-xs">
              {isLender ? "Borrower" : "Lender"}
            </p>
            <p className="text-gray-900 font-bold text-base">
              {counterparty}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">
              {loan.payment_frequency}
            </p>
            <p className="text-gray-500 text-xs">
              {loan.interest_rate > 0 ? `${loan.interest_rate}% interest` : "No interest"}
            </p>
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8F9FB] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Total Owed</p>
              </div>
              <p className="text-gray-900 font-bold text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${loan.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Check className="w-3 h-3 text-emerald-500" />
                <p className="text-emerald-600 text-[10px] uppercase tracking-wider">Total Paid</p>
              </div>
              <p className="text-emerald-600 font-bold text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="bg-[#1B2E4B] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3 h-3 text-white/50" />
                  <p className="text-white/60 text-[10px] uppercase tracking-wider">Remaining Balance</p>
                </div>
                <p className="text-white font-bold text-2xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px]">Per payment</p>
                <p className="text-white/80 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${scheduledPaymentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{confirmedPayments.length} of {loan.number_of_payments} payments</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  progress === 100 ? "bg-emerald-500" : "bg-[#1B2E4B]"
                }`}
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span>Started {new Date(loan.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>Due {new Date(loan.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </motion.div>

        {/* Pending Confirmations Alert */}
        {pendingPayments.length > 0 && canUserConfirm(pendingPayments[0]) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-amber-800 text-sm font-semibold">
                {pendingPayments.filter((p) => canUserConfirm(p)).length} payment{pendingPayments.filter((p) => canUserConfirm(p)).length > 1 ? "s" : ""} awaiting your confirmation
              </p>
              <p className="text-amber-600/70 text-xs">Review and confirm below</p>
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
            <h3 className="text-gray-900 font-bold text-sm">Payment History</h3>
            <span className="text-gray-400 text-xs">
              {payments.length} transaction{payments.length !== 1 ? "s" : ""}
            </span>
          </div>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 bg-white rounded-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">No payments recorded yet</p>
              <p className="text-gray-300 text-xs">
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
                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${s.border}`}
                  >
                    <div className="flex items-center gap-3 p-3.5">
                      <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            ${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase ${s.color} px-1.5 py-0.5 rounded-md ${s.bg}`}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-gray-400 text-xs">
                            {new Date(payment.payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <span className="text-gray-200 text-[10px]">·</span>
                          <span className="text-gray-300 text-[10px]">
                            {registeredByUser ? "You registered" : `${counterparty} registered`}
                          </span>
                        </div>
                        {payment.note && (
                          <p className="text-gray-400 text-xs mt-1 italic">"{payment.note}"</p>
                        )}
                      </div>
                    </div>

                    {userCanConfirm && (
                      <div className="flex border-t border-gray-100">
                        <button
                          onClick={() => handleRejectPayment(payment)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Reject</span>
                        </button>
                        <div className="w-px bg-gray-100" />
                        <button
                          onClick={() => handleConfirmPayment(payment)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Confirm</span>
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
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >
            <h4 className="text-gray-400 text-[10px] uppercase tracking-wider mb-3">
              Payment Summary
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Confirmed</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-gray-300 text-[10px]">({confirmedPayments.length})</span>
                </div>
              </div>
              {pendingPayments.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Pending</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ${pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-300 text-[10px]">({pendingPayments.length})</span>
                  </div>
                </div>
              )}
              {rejectedPayments.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Rejected</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ${rejectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-300 text-[10px]">({rejectedPayments.length})</span>
                  </div>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 mt-1 flex items-center justify-between">
                <span className="text-gray-600 text-xs font-semibold">Still to pay</span>
                <span className="text-gray-900 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* CTA */}
      {loan.status === "active" && remainingBalance > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-5 pb-6 bg-white pt-4 border-t border-gray-100"
        >
          <button
            onClick={() => {
              selectLoan(loan.loan_id);
              navigate("register-payment");
            }}
            className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#1B2E4B]/20"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Register Payment
          </button>
        </motion.div>
      )}
    </div>
  );
}
