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
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  active: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  declined: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

export default function LoanCard({ loan, index = 0 }: LoanCardProps) {
  const { currentUser, getLoanComputed, navigate, selectLoan, payments } = useApp();
  const isLender = loan.lender_id === currentUser?.id;
  const counterparty = isLender ? loan.borrower_name : loan.lender_name;
  const counterpartyAvatar = isLender ? loan.borrower_avatar : loan.lender_avatar;

  const { confirmedPayments, confirmedAmount, remainingBalance, progress } = getLoanComputed(loan.loan_id);

  const pendingPayments = payments.filter(
    (p) => p.loan_id === loan.loan_id && p.status === "pending_confirmation" && p.created_by_user !== currentUser?.id
  );

  const statusStyle = statusColors[loan.status];

  const handleTap = () => {
    selectLoan(loan.loan_id);
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
      className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform shadow-sm hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <AvatarBadge initials={counterpartyAvatar || counterparty.slice(0, 2)} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-900 font-semibold text-sm truncate">
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
              <span className="text-gray-400 text-[10px] block">
                {isLender ? "You lent" : "You owe"}
              </span>
              <span
                className={`text-lg font-bold ${isLender ? "text-[#1B2E4B]" : "text-amber-600"}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
            {loan.status !== "pending" && confirmedAmount > 0 && (
              <div className="text-right">
                <span className="text-gray-300 text-[10px] block">
                  Paid
                </span>
                <span className="text-emerald-600 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${confirmedAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {loan.status !== "pending" && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{confirmedPayments.length}/{loan.number_of_payments} payments</span>
                <span>Due {new Date(loan.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.5 + index * 0.08, duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    progress === 100
                      ? "bg-emerald-500"
                      : "bg-[#1B2E4B]"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Pending confirmation badge */}
          {pendingPayments.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span className="text-amber-600 text-[10px] font-semibold">
                {pendingPayments.length} payment{pendingPayments.length > 1 ? "s" : ""} to confirm
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
      </div>
    </motion.div>
  );
}
