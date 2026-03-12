import { motion } from "framer-motion";
import { Plus, Filter } from "lucide-react";
import { useApp } from "@/context/AppContext";
import LoanCard from "@/components/shared/LoanCard";
import { useState } from "react";

type Filter = "all" | "lent" | "borrowed" | "active" | "completed";

export default function LoansScreen() {
  const { currentUser, loans, navigate } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const myLoans = loans.filter(
    (l) => l.lender_id === currentUser?.id || l.borrower_id === currentUser?.id
  );

  const filtered = myLoans.filter((l) => {
    if (filter === "all") return true;
    if (filter === "lent") return l.lender_id === currentUser?.id;
    if (filter === "borrowed") return l.borrower_id === currentUser?.id;
    if (filter === "active") return l.status === "active";
    if (filter === "completed") return l.status === "completed";
    return true;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "lent", label: "Lent" },
    { id: "borrowed", label: "Borrowed" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Done" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            My Loans
          </h1>
          <span className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {myLoans.length} total
          </span>
        </motion.div>

        {/* Filter chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-[#00C9A7] text-[#0D1B2A]"
                  : "bg-[#1A2B3C] text-white/50 border border-white/5"
              }`}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {f.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Loans list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <div className="w-16 h-16 rounded-3xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
              No loans found
            </p>
          </div>
        ) : (
          filtered.map((loan, idx) => (
            <LoanCard key={loan.loan_id} loan={loan} index={idx} />
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        onClick={() => navigate("create-loan")}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-2xl bg-[#00C9A7] shadow-lg shadow-[#00C9A7]/30 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-[#0D1B2A]" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
