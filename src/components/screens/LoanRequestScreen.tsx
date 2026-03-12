import { motion } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";

export default function LoanRequestScreen() {
  const { selectedLoanId, getLoanById, navigate, acceptLoan, declineLoan, selectLoan } = useApp();
  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;

  if (!loan) {
    return (
      <div className="flex flex-col h-full bg-[#0D1B2A] items-center justify-center">
        <p className="text-white/40">Loan not found</p>
      </div>
    );
  }

  if (loan.status !== "pending") {
    return (
      <div className="flex flex-col h-full bg-[#0D1B2A] items-center justify-center gap-3">
        <p className="text-white/40">This loan is already {loan.status}</p>
        <button
          onClick={() => {
            selectLoan(loan.loan_id);
            navigate("loan-details");
          }}
          className="text-[#00C9A7] text-sm font-semibold"
        >
          View Loan Details
        </button>
      </div>
    );
  }

  const lender = loan.lender_name;

  const handleAccept = () => {
    acceptLoan(loan.loan_id);
    selectLoan(loan.loan_id);
    navigate("loan-details");
  };

  const handleDecline = () => {
    declineLoan(loan.loan_id);
    navigate("dashboard");
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate("dashboard")} className="w-10 h-10 rounded-2xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <h2 className="text-white font-bold text-base flex-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Loan Request
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {/* Lender info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A2B3C] border border-[#FFB347]/20 rounded-3xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <AvatarBadge initials={loan.lender_avatar || loan.lender_name.slice(0, 2)} size="lg" />
            <div>
              <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>Loan request from</p>
              <p className="text-white font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>{lender}</p>
            </div>
            <div className="ml-auto px-3 py-1 rounded-full bg-[#FFB347]/10 border border-[#FFB347]/30">
              <span className="text-[#FFB347] text-xs font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>Pending</span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-[#0D1B2A]/40 rounded-2xl p-4 text-center mb-4">
            <p className="text-white/40 text-xs mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Loan Amount</p>
            <p className="text-[#00C9A7] text-4xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>
              ${loan.loan_amount.toLocaleString()}
            </p>
            {loan.interest_rate > 0 && (
              <p className="text-white/30 text-xs mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Total with {loan.interest_rate}% interest: ${loan.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Details grid */}
          <div className="space-y-3">
            {[
              { label: "Payments", value: `${loan.number_of_payments} × ${loan.payment_frequency}` },
              { label: "Per Payment", value: `$${(loan.total_amount / loan.number_of_payments).toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
              { label: "Start Date", value: new Date(loan.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Due Date", value: new Date(loan.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{label}</span>
                <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/30 text-xs text-center"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          By accepting, you agree to repay this loan according to the terms above
        </motion.p>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-5 pb-6 flex gap-3"
      >
        <button
          onClick={handleDecline}
          className="flex-1 h-14 rounded-2xl bg-[#1A2B3C] border border-[#FF6B6B]/30 text-[#FF6B6B] font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <X className="w-5 h-5" />
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#00C9A7]/20"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <Check className="w-5 h-5" strokeWidth={2.5} />
          Accept Loan
        </button>
      </motion.div>
    </div>
  );
}
