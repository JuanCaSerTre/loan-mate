import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            My Loans
          </h1>
          <span className="text-gray-400 text-sm">
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-[#1B2E4B] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Loans list */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-gray-400 text-sm">
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
        className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-[#1B2E4B] shadow-lg shadow-[#1B2E4B]/30 flex items-center justify-center z-20 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
