import { motion } from "framer-motion";
import { Plus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import LoanCard from "@/components/shared/LoanCard";
import AvatarBadge from "@/components/shared/AvatarBadge";

export default function DashboardScreen() {
  const {
    currentUser,
    loans,
    navigate,
    selectLoan,
    getTotalLent,
    getTotalBorrowed,
    getPendingActions,
  } = useApp();

  const totalLent = getTotalLent();
  const totalBorrowed = getTotalBorrowed();
  const pendingCount = getPendingActions();

  const activeLoans = loans.filter(
    (l) =>
      (l.lender_id === currentUser?.id || l.borrower_id === currentUser?.id) &&
      (l.status === "active" || l.status === "pending")
  );

  // Find pending loan requests for current user as borrower
  const pendingLoanRequests = loans.filter(
    (l) => l.status === "pending" && l.borrower_id === currentUser?.id
  );

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-6 overflow-hidden">
        {/* Mesh gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-[#00C9A7] opacity-[0.06] blur-3xl" />
          <div className="absolute top-10 left-0 w-40 h-40 rounded-full bg-[#00C9A7] opacity-[0.03] blur-2xl" />
        </div>

        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between z-10 relative"
        >
          <div>
            <p className="text-white/50 text-xs font-medium tracking-wider uppercase" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Good morning 👋
            </p>
            <h2 className="text-white text-xl font-black mt-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
              {currentUser?.name.split(" ")[0]}
            </h2>
          </div>
          <AvatarBadge
            initials={currentUser?.avatar || currentUser?.name.slice(0, 2) || "U"}
            size="md"
          />
        </motion.div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        {/* Balance summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Total Lent */}
          <div className="relative bg-[#1A2B3C] border border-[#00C9A7]/20 rounded-3xl p-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#00C9A7] opacity-[0.05] -translate-y-4 translate-x-4 blur-xl pointer-events-none" />
            <TrendingUp className="w-5 h-5 text-[#00C9A7] mb-2" />
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Total Lent
            </p>
            <p className="text-[#00C9A7] text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>
              ${totalLent.toLocaleString()}
            </p>
          </div>

          {/* Total Borrowed */}
          <div className="relative bg-[#1A2B3C] border border-[#FFB347]/20 rounded-3xl p-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#FFB347] opacity-[0.05] -translate-y-4 translate-x-4 blur-xl pointer-events-none" />
            <TrendingDown className="w-5 h-5 text-[#FFB347] mb-2" />
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Total Owed
            </p>
            <p className="text-[#FFB347] text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>
              ${totalBorrowed.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Pending Actions Banner */}
        {pendingCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => {
              if (pendingLoanRequests.length > 0) {
                selectLoan(pendingLoanRequests[0].loan_id);
                navigate("loan-request");
              }
            }}
            className="w-full flex items-center gap-3 bg-[#FFB347]/10 border border-[#FFB347]/30 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFB347]/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#FFB347]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[#FFB347] text-sm font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {pendingCount} action{pendingCount > 1 ? "s" : ""} need your attention
              </p>
              <p className="text-[#FFB347]/60 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Tap to review
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#FFB347] flex items-center justify-center">
              <span className="text-[#0D1B2A] text-xs font-black">{pendingCount}</span>
            </div>
          </motion.button>
        )}

        {/* Active Loans */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-3"
          >
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Active Loans
            </h3>
            <button
              onClick={() => navigate("loans")}
              className="text-[#00C9A7] text-xs font-semibold"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              See all
            </button>
          </motion.div>

          {activeLoans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-2 py-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                No active loans yet
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeLoans.slice(0, 5).map((loan, idx) => (
                <LoanCard key={loan.loan_id} loan={loan} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={() => navigate("create-loan")}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-2xl bg-[#00C9A7] shadow-lg shadow-[#00C9A7]/30 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-[#0D1B2A]" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
