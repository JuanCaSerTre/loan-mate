import { motion } from "framer-motion";
import { Plus, AlertTriangle, ArrowUpRight, ArrowDownLeft, BookUser, Share2, Copy, Crown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useInvitations } from "@/hooks/useInvitations";
import { useSubscription } from "@/hooks/useSubscription";
import LoanCard from "@/components/shared/LoanCard";
import AvatarBadge from "@/components/shared/AvatarBadge";
import UpgradePrompt from "@/components/shared/UpgradePrompt";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { trackComputedMetrics, trackDailyActiveUser } from "@/services/analyticsService";
import { SUBSCRIPTION } from "@/config/constants";

export default function DashboardScreen() {
  const {
    currentUser,
    loans,
    payments,
    navigate,
    selectLoan,
    getTotalLent,
    getTotalBorrowed,
    getPendingActions,
    getPendingLoanRequests,
    getPendingPaymentConfirmations,
  } = useApp();

  const {
    isPremium,
    hasReachedFreeLimit,
    canCreateLoan,
    activeLoansCount,
    remainingFreeLoans,
    startCheckout,
    isCheckoutLoading,
  } = useSubscription(currentUser, loans);

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Track computed metrics and DAU each time the dashboard is visited
  useEffect(() => {
    if (currentUser) {
      trackDailyActiveUser(currentUser.id);
      trackComputedMetrics(loans, payments);
    }
  }, [currentUser, loans, payments]);

  const totalLent = getTotalLent();
  const totalBorrowed = getTotalBorrowed();
  const pendingCount = getPendingActions();
  const pendingLoanRequests = getPendingLoanRequests();
  const pendingPaymentConfirmations = getPendingPaymentConfirmations();

  const { copyLink } = useInvitations(currentUser?.id || "", currentUser?.name || "");

  const handleCopyInviteLink = async () => {
    const { success } = await copyLink();
    if (success) {
      toast.success("Invitation link copied!", {
        icon: "📋",
        description: "Share with friends to start tracking loans",
      });
    }
  };

  const activeLoans = loans.filter(
    (l) =>
      (l.lender_id === currentUser?.id || l.borrower_id === currentUser?.id) &&
      (l.status === "active" || l.status === "pending")
  );

  const handlePendingBannerTap = () => {
    if (pendingLoanRequests.length > 0) {
      selectLoan(pendingLoanRequests[0].loan_id);
      navigate("loan-request");
    } else if (pendingPaymentConfirmations.length > 0) {
      const payment = pendingPaymentConfirmations[0];
      selectLoan(payment.loan_id);
      navigate("loan-details");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="bg-[#1B2E4B] px-5 pt-12 pb-8 rounded-b-[32px]">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-white/60 text-xs font-medium">
              Good morning 👋
            </p>
            <h2 className="text-white text-xl font-bold mt-0.5">
              {currentUser?.name.split(" ")[0]}
            </h2>
          </div>
          <AvatarBadge
            initials={currentUser?.avatar || currentUser?.name.slice(0, 2) || "U"}
            size="md"
            className="ring-2 ring-white/20"
          />
        </motion.div>

        {/* Balance summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mt-5"
        >
          {/* Total Lent */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-white/60 text-[11px] font-medium">Total Lent</span>
            </div>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${totalLent.toLocaleString()}
            </p>
          </div>

          {/* Total Borrowed */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-white/60 text-[11px] font-medium">Total Owed</span>
            </div>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${totalBorrowed.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-4">
        {/* Pending Actions Banner */}
        {pendingCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => handlePendingBannerTap()}
            className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-amber-800 text-sm font-semibold">
                {pendingCount} action{pendingCount > 1 ? "s" : ""} need your attention
              </p>
              <p className="text-amber-600/70 text-xs">
                {pendingLoanRequests.length > 0 && `${pendingLoanRequests.length} loan request${pendingLoanRequests.length > 1 ? "s" : ""}`}
                {pendingLoanRequests.length > 0 && pendingPaymentConfirmations.length > 0 && " · "}
                {pendingPaymentConfirmations.length > 0 && `${pendingPaymentConfirmations.length} payment${pendingPaymentConfirmations.length > 1 ? "s" : ""} to confirm`}
                {pendingLoanRequests.length === 0 && pendingPaymentConfirmations.length === 0 && "Tap to review"}
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{pendingCount}</span>
            </div>
          </motion.button>
        )}

        {/* Find Friends Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="space-y-2"
        >
          <button
            onClick={() => navigate("contacts")}
            className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1B2E4B]/5 flex items-center justify-center flex-shrink-0">
              <BookUser className="w-5 h-5 text-[#1B2E4B]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 text-sm font-semibold">
                Find Friends on LoanMate
              </p>
              <p className="text-gray-400 text-xs">
                Sync contacts · Create loans instantly
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#1B2E4B] flex items-center justify-center">
              <span className="text-white text-xs font-bold">→</span>
            </div>
          </button>

          <button
            onClick={handleCopyInviteLink}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-[#1B2E4B]/[0.03] to-[#2A4365]/[0.06] border border-gray-100 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 text-sm font-semibold">
                Invite Friends
              </p>
              <p className="text-gray-400 text-xs">
                SMS · WhatsApp · Copy link
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Copy className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </button>
        </motion.div>

        {/* Free Plan Limit Banner */}
        {!isPremium && activeLoansCount >= SUBSCRIPTION.FREE_LOAN_LIMIT - 1 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.19 }}
            onClick={() => setShowUpgradePrompt(true)}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-amber-800 text-sm font-semibold">
                {hasReachedFreeLimit
                  ? "Loan limit reached"
                  : `${remainingFreeLoans} loan${remainingFreeLoans === 1 ? "" : "s"} remaining`}
              </p>
              <p className="text-amber-600/70 text-xs">
                Upgrade to Premium for unlimited loans
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              PRO
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
            <h3 className="text-gray-900 font-bold text-base">
              Active Loans
            </h3>
            <button
              onClick={() => navigate("loans")}
              className="text-[#1B2E4B] text-xs font-semibold"
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
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <p className="text-gray-400 text-sm">
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
        onClick={() => {
          if (canCreateLoan) {
            navigate("create-loan");
          } else {
            setShowUpgradePrompt(true);
          }
        }}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-[#1B2E4B] shadow-lg shadow-[#1B2E4B]/30 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </motion.button>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={async (plan) => {
          await startCheckout(plan);
          setShowUpgradePrompt(false);
        }}
        isLoading={isCheckoutLoading}
        activeLoansCount={activeLoansCount}
      />
    </div>
  );
}
