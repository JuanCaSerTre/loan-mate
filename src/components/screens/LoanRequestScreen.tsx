import { motion } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";

export default function LoanRequestScreen() {
  const { selectedLoanId, getLoanById, navigate, acceptLoan, declineLoan, selectLoan } = useApp();
  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;

  if (!loan) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FB] items-center justify-center">
        <p className="text-gray-400">Loan not found</p>
      </div>
    );
  }

  if (loan.status !== "pending") {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FB] items-center justify-center gap-3">
        <p className="text-gray-400">This loan is already {loan.status}</p>
        <button
          onClick={() => {
            selectLoan(loan.loan_id);
            navigate("loan-details");
          }}
          className="text-[#1B2E4B] text-sm font-semibold"
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
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate("dashboard")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-gray-900 font-bold text-base flex-1">
          Loan Request
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">
        {/* Lender info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <AvatarBadge initials={loan.lender_avatar || loan.lender_name.slice(0, 2)} size="lg" />
            <div>
              <p className="text-gray-400 text-xs">Loan request from</p>
              <p className="text-gray-900 font-bold text-lg">{lender}</p>
            </div>
            <div className="ml-auto px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
              <span className="text-amber-700 text-xs font-semibold">Pending</span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-[#F8F9FB] rounded-2xl p-4 text-center mb-4">
            <p className="text-gray-400 text-xs mb-1">Loan Amount</p>
            <p className="text-[#1B2E4B] text-4xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${loan.loan_amount.toLocaleString()}
            </p>
            {loan.interest_rate > 0 && (
              <p className="text-gray-400 text-xs mt-1">
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
                <span className="text-gray-400 text-sm">{label}</span>
                <span className="text-gray-900 font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-xs text-center"
        >
          By accepting, you agree to repay this loan according to the terms above
        </motion.p>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-5 pb-6 flex gap-3 bg-white pt-4 border-t border-gray-100"
      >
        <button
          onClick={handleDecline}
          className="flex-1 h-14 rounded-2xl bg-white border border-red-200 text-red-500 font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <X className="w-5 h-5" />
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#1B2E4B]/20"
        >
          <Check className="w-5 h-5" strokeWidth={2.5} />
          Accept Loan
        </button>
      </motion.div>
    </div>
  );
}
