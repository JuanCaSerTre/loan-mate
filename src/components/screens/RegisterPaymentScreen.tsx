import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Send, ShieldAlert } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { toast } from "sonner";

export default function RegisterPaymentScreen() {
  const { selectedLoanId, getLoanById, getLoanComputed, navigate, currentUser, registerPayment, validatePaymentRegistration } = useApp();
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
  const [securityError, setSecurityError] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    if (!validateAmount(amount)) return;

    // Security validation
    const validation = validatePaymentRegistration({
      loanId: loan.loan_id,
      amount: parsedAmount,
    });

    if (!validation.allowed) {
      setSecurityError(validation.reason || "Payment blocked by security policy.");
      toast.error("Payment blocked", { description: validation.reason });
      return;
    }

    setSecurityError(null);
    setIsSubmitting(true);

    const result = await registerPayment({
      loanId: loan.loan_id,
      amount: parsedAmount,
      paymentDate: date,
      note: note || undefined,
    });

    setIsSubmitting(false);

    if (result && !result.allowed) {
      setSecurityError(result.reason || "Payment blocked.");
      toast.error("Payment blocked", { description: result.reason });
      return;
    }

    toast.success("Payment submitted!", {
      description: `$${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} sent to ${counterparty} for confirmation`,
    });
    navigate("loan-details");
  };

  // Quick amount buttons
  const quickAmounts = [
    { label: "Scheduled", value: Math.min(scheduledAmount, remaining) },
    { label: "Half", value: Math.min(remaining / 2, remaining) },
    { label: "Full", value: remaining },
  ].filter((q) => q.value > 0);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate("loan-details")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-gray-900 font-bold text-base flex-1">
          Register Payment
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">
        {/* Loan context card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="md" />
            <div className="flex-1">
              <p className="text-gray-400 text-xs">Loan with</p>
              <p className="text-gray-900 font-semibold text-sm">{counterparty}</p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
              <span className="text-blue-700 text-[10px] font-semibold uppercase">Active</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#F8F9FB] rounded-xl p-2.5 text-center">
              <p className="text-gray-400 text-[9px] uppercase tracking-wider mb-0.5">Total</p>
              <p className="text-gray-900 font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${loan.total_amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
              <p className="text-emerald-600 text-[9px] uppercase tracking-wider mb-0.5">Paid</p>
              <p className="text-emerald-600 font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
              <p className="text-amber-600 text-[9px] uppercase tracking-wider mb-0.5">Remaining</p>
              <p className="text-amber-600 font-bold text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${remaining.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{computed?.confirmedPayments.length ?? 0} of {loan.number_of_payments} payments</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1B2E4B] transition-all duration-500"
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
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2E4B] font-bold text-xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountError("");
              }}
              className={`w-full h-16 pl-10 pr-4 rounded-2xl bg-white border text-gray-900 text-2xl font-bold focus:outline-none ${
                amountError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

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
                    ? "bg-[#1B2E4B] text-white"
                    : "bg-white text-gray-500 border border-gray-200 active:bg-gray-50"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {amountError && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <p className="text-red-500 text-xs">{amountError}</p>
            </div>
          )}

          {parsedAmount > 0 && parsedAmount <= remaining && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2"
            >
              <span className="text-gray-500 text-xs">Balance after this payment</span>
              <span className={`font-bold text-sm ${newRemainingAfterPayment === 0 ? "text-emerald-600" : "text-gray-700"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
            Payment Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-14 px-4 rounded-2xl bg-white border border-gray-200 text-gray-900 text-base focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
          />
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for this payment..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20 resize-none"
          />
        </motion.div>
      </div>

      {/* Submit */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-5 pb-6 space-y-2 bg-white pt-4 border-t border-gray-100"
      >
        {/* Security Error */}
        {securityError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs">{securityError}</p>
            </div>
          </div>
        )}
        <p className="text-gray-400 text-[10px] text-center">
          {counterparty} will need to confirm this payment
        </p>
        <button
          onClick={handleSubmit}
          disabled={!amount || parsedAmount <= 0 || isSubmitting}
          className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all shadow-lg shadow-[#1B2E4B]/20"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
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
