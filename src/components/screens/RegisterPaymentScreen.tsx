import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { toast } from "sonner";

export default function RegisterPaymentScreen() {
  const { selectedLoanId, getLoanById, getLoanComputed, navigate, currentUser, registerPayment } = useApp();
  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;
  const computed = selectedLoanId ? getLoanComputed(selectedLoanId) : null;

  const remaining = computed?.remainingBalance ?? 0;
  const scheduledAmount = computed?.scheduledPaymentAmount ?? 0;
  const confirmedAmount = computed?.confirmedAmount ?? 0;
  const progress = computed?.progress ?? 0;

  const [amount, setAmount] = useState(scheduledAmount > 0 ? Math.min(scheduledAmount, remaining).toFixed(2) : "0.00");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loan) return null;

  const isLender = loan.lender_id === currentUser?.id;
  const counterparty = isLender ? loan.borrower_name : loan.lender_name;
  const counterpartyAvatar = isLender ? loan.borrower_avatar : loan.lender_avatar;

  const parsedAmount = parseFloat(amount) || 0;
  const newRemainingAfterPayment = Math.max(0, remaining - parsedAmount);

  const validateAmount = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setAmountError("Amount must be greater than 0");
      return false;
    }
    if (num > remaining) {
      setAmountError(`Amount exceeds remaining balance ($${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })})`);
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleSubmit = () => {
    if (!validateAmount(amount)) return;

    setIsSubmitting(true);
    setTimeout(() => {
      registerPayment({
        loanId: loan.loan_id,
        amount: parsedAmount,
        paymentDate: date,
        note: note || undefined,
      });

      toast.success("Payment submitted!", {
        description: `$${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} sent to ${counterparty} for confirmation`,
        style: {
          background: "#1A2B3C",
          border: "1px solid rgba(0,201,167,0.3)",
          color: "#fff",
        },
      });
      navigate("loan-details");
    }, 500);
  };

  // Quick amount buttons
  const quickAmounts = [
    { label: "Scheduled", value: Math.min(scheduledAmount, remaining) },
    { label: "Half", value: Math.min(remaining / 2, remaining) },
    { label: "Full", value: remaining },
  ].filter((q) => q.value > 0);

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate("loan-details")} className="w-10 h-10 rounded-2xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <h2 className="text-white font-bold text-base flex-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Register Payment
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {/* Loan context card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2B3C] border border-white/5 rounded-3xl p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="md" />
            <div className="flex-1">
              <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Loan with</p>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{counterparty}</p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/20">
              <span className="text-[#00C9A7] text-[10px] font-semibold uppercase" style={{ fontFamily: "'Manrope', sans-serif" }}>Active</span>
            </div>
          </div>

          {/* Loan financials mini-summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0D1B2A]/60 rounded-xl p-2.5 text-center">
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>Total</p>
              <p className="text-white font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${loan.total_amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-[#00C9A7]/5 rounded-xl p-2.5 text-center">
              <p className="text-[#00C9A7]/50 text-[9px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>Paid</p>
              <p className="text-[#00C9A7] font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-[#FFB347]/5 rounded-xl p-2.5 text-center">
              <p className="text-[#FFB347]/50 text-[9px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>Remaining</p>
              <p className="text-[#FFB347] font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${remaining.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div>
            <div className="flex justify-between text-[10px] text-white/30 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <span>{computed?.confirmedPayments.length ?? 0} of {loan.number_of_payments} payments</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00C9A7] to-[#00C9A7]/70 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Amount Input */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00C9A7] font-bold text-xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountError("");
              }}
              className={`w-full h-16 pl-10 pr-4 rounded-2xl bg-[#1A2B3C] border text-white text-2xl font-black focus:outline-none ${
                amountError ? "border-[#FF6B6B]/50 focus:border-[#FF6B6B]/50" : "border-white/10 focus:border-[#00C9A7]/50"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2 mt-2">
            {quickAmounts.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  setAmount(q.value.toFixed(2));
                  setAmountError("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  parseFloat(amount) === q.value
                    ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30"
                    : "bg-[#1A2B3C] text-white/40 border border-white/5 active:bg-white/5"
                }`}
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {amountError && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#FF6B6B]" />
              <p className="text-[#FF6B6B] text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {amountError}
              </p>
            </div>
          )}

          {/* After-payment preview */}
          {parsedAmount > 0 && parsedAmount <= remaining && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-center justify-between bg-[#00C9A7]/5 border border-[#00C9A7]/10 rounded-xl px-3 py-2"
            >
              <span className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Balance after this payment
              </span>
              <span className={`font-bold text-sm ${newRemainingAfterPayment === 0 ? "text-[#00C9A7]" : "text-white/70"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${newRemainingAfterPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                {newRemainingAfterPayment === 0 && " ✓"}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Date */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Payment Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-base focus:outline-none focus:border-[#00C9A7]/50 [color-scheme:dark]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          />
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for this payment..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00C9A7]/50 resize-none"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          />
        </motion.div>
      </div>

      {/* Submit */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-5 pb-6 space-y-2"
      >
        <p className="text-white/20 text-[10px] text-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {counterparty} will need to confirm this payment
        </p>
        <button
          onClick={handleSubmit}
          disabled={!amount || parsedAmount <= 0 || isSubmitting}
          className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all shadow-lg shadow-[#00C9A7]/20"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-[#0D1B2A] border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Send className="w-5 h-5" strokeWidth={2.5} />
              Submit Payment · ${parsedAmount > 0 ? parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
