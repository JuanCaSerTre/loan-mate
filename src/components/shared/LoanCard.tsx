import { Loan } from "@/types/loan";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "./AvatarBadge";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Check, AlertCircle } from "lucide-react";

interface LoanCardProps {
  loan: Loan;
  index?: number;
}

const statusColors = {
  pending: { bg: "bg-[#FFB347]/10", text: "text-[#FFB347]", border: "border-[#FFB347]/20" },
  active: { bg: "bg-[#00C9A7]/10", text: "text-[#00C9A7]", border: "border-[#00C9A7]/20" },
  completed: { bg: "bg-white/5", text: "text-white/40", border: "border-white/10" },
  declined: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]/20" },
};

export default function LoanCard({ loan, index = 0 }: LoanCardProps) {
  const { currentUser, getLoanComputed, navigate, selectLoan, payments } = useApp();
  const isLender = loan.lender_id === currentUser?.id;
  const counterparty = isLender ? loan.borrower_name : loan.lender_name;
  const counterpartyAvatar = isLender ? loan.borrower_avatar : loan.lender_avatar;

  const { confirmedPayments, confirmedAmount, remainingBalance, progress } = getLoanComputed(loan.loan_id);

  // Check for pending payment confirmations on this loan
  const pendingPayments = payments.filter(
    (p) => p.loan_id === loan.loan_id && p.status === "pending_confirmation" && p.created_by_user !== currentUser?.id
  );

  const statusStyle = statusColors[loan.status];

  const handleTap = () => {
    selectLoan(loan.loan_id);
    // If this is a pending loan and user is borrower, go to request screen
    if (loan.status === "pending" && !isLender) {
      navigate("loan-request");
    } else {
      navigate("loan-details");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={handleTap}
      className="relative bg-[#1A2B3C] border border-white/5 rounded-3xl p-4 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/[0.02] rounded-3xl pointer-events-none" />

      <div className="flex items-start gap-3">
        <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-semibold text-sm truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {counterparty}
            </span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {loan.status === "pending" && <Clock className="w-2.5 h-2.5" />}
              {loan.status === "completed" && <Check className="w-2.5 h-2.5" />}
              {loan.status}
            </div>
          </div>

          {/* Financial row */}
          <div className="flex items-center justify-between mt-1.5">
            <div>
              <span
                className="text-white/40 text-[10px] block"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {isLender ? "You lent" : "You owe"}
              </span>
              <span
                className={`text-base font-black ${isLender ? "text-[#00C9A7]" : "text-[#FFB347]"}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
            {loan.status !== "pending" && confirmedAmount > 0 && (
              <div className="text-right">
                <span className="text-white/25 text-[10px] block" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Paid
                </span>
                <span className="text-[#00C9A7]/60 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {loan.status !== "pending" && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-white/30 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                <span>{confirmedPayments.length}/{loan.number_of_payments} payments</span>
                <span>Due {new Date(loan.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.5 + index * 0.08, duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    progress === 100
                      ? "bg-gradient-to-r from-[#00C9A7] to-[#00E5BD]"
                      : "bg-gradient-to-r from-[#00C9A7] to-[#00C9A7]/70"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Pending confirmation badge */}
          {pendingPayments.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle className="w-3 h-3 text-[#FFB347]" />
              <span className="text-[#FFB347] text-[10px] font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {pendingPayments.length} payment{pendingPayments.length > 1 ? "s" : ""} to confirm
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-white/20 mt-1 flex-shrink-0" />
      </div>
    </motion.div>
  );
}
