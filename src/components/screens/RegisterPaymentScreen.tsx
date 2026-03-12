import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Payment } from "@/types/loan";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { toast } from "sonner";

export default function RegisterPaymentScreen() {
  const { selectedLoanId, getLoanById, getPaymentsForLoan, navigate, currentUser, addPayment, addNotification } = useApp();
  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;

  const payments = selectedLoanId ? getPaymentsForLoan(selectedLoanId) : [];
  const confirmedAmount = payments
    .filter((p) => p.status === "confirmed")
    .reduce((s, p) => s + p.amount, 0);
  const remaining = loan ? loan.total_amount - confirmedAmount : 0;
  const scheduledAmount = loan ? loan.total_amount / loan.number_of_payments : 0;

  const [amount, setAmount] = useState(scheduledAmount.toFixed(2));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  if (!loan) return null;

  const isLender = loan.lender_id === currentUser?.id;
  const counterparty = isLender ? loan.borrower_name : loan.lender_name;
  const counterpartyAvatar = isLender ? loan.borrower_avatar : loan.lender_avatar;

  const handleSubmit = () => {
    const newPayment: Payment = {
      payment_id: `pay_${Date.now()}`,
      loan_id: loan.loan_id,
      amount: parseFloat(amount),
      created_by_user: currentUser!.id,
      status: "pending_confirmation",
      note: note || undefined,
      created_at: new Date().toISOString(),
      payment_date: date,
    };
    addPayment(newPayment);
    addNotification({
      id: `notif_${Date.now()}`,
      type: "payment_registered",
      title: "Payment Registered",
      message: `You registered a payment of $${parseFloat(amount).toLocaleString()} for ${counterparty} to confirm`,
      loan_id: loan.loan_id,
      payment_id: newPayment.payment_id,
      read: false,
      created_at: new Date().toISOString(),
    });
    toast.success("Payment submitted!", {
      description: `$${parseFloat(amount).toLocaleString()} sent for confirmation`,
      style: {
        background: "#1A2B3C",
        border: "1px solid rgba(0,201,167,0.3)",
        color: "#fff",
      },
    });
    navigate("loan-details");
  };

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

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
        {/* Loan context */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#1A2B3C] border border-white/5 rounded-3xl p-4"
        >
          <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="md" />
          <div className="flex-1">
            <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Loan with</p>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{counterparty}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Remaining</p>
            <p className="text-[#FFB347] font-black text-base" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>

        {/* Amount */}
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
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-16 pl-10 pr-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-2xl font-black focus:outline-none focus:border-[#00C9A7]/50"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Scheduled: ${scheduledAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} per payment
          </p>
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
        className="px-5 pb-6"
      >
        <button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all shadow-lg shadow-[#00C9A7]/20"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <Check className="w-5 h-5" strokeWidth={2.5} />
          Submit Payment
        </button>
      </motion.div>
    </div>
  );
}
