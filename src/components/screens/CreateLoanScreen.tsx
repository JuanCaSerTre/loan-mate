import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Search, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Loan, PaymentFrequency } from "@/types/loan";
import AvatarBadge from "@/components/shared/AvatarBadge";

type Step = 1 | 2 | 3;

export default function CreateLoanScreen() {
  const { navigate, currentUser, findUserByPhone, addLoan, addNotification, selectLoan } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [foundUser, setFoundUser] = useState<ReturnType<typeof findUserByPhone>>(undefined);
  const [searchError, setSearchError] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [numPayments, setNumPayments] = useState("3");
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const frequencies: { id: PaymentFrequency; label: string }[] = [
    { id: "weekly", label: "Weekly" },
    { id: "biweekly", label: "Biweekly" },
    { id: "monthly", label: "Monthly" },
  ];

  const calculateDueDate = () => {
    const start = new Date(startDate);
    const n = parseInt(numPayments) || 1;
    if (frequency === "weekly") start.setDate(start.getDate() + n * 7);
    else if (frequency === "biweekly") start.setDate(start.getDate() + n * 14);
    else start.setMonth(start.getMonth() + n);
    return start.toISOString().split("T")[0];
  };

  const totalAmount = () => {
    const a = parseFloat(amount) || 0;
    const r = parseFloat(interestRate) || 0;
    return a + (a * r) / 100;
  };

  const handleFindBorrower = () => {
    if (!borrowerPhone.trim()) {
      setSearchError("Enter a phone number");
      return;
    }
    const user = findUserByPhone(borrowerPhone);
    if (!user) {
      setSearchError("No user found with this number");
      setFoundUser(undefined);
      return;
    }
    if (user.id === currentUser?.id) {
      setSearchError("You can't create a loan with yourself");
      setFoundUser(undefined);
      return;
    }
    setFoundUser(user);
    setSearchError("");
  };

  const handleSubmit = () => {
    if (!foundUser || !currentUser) return;
    const loanId = `loan_${Date.now()}`;
    const dueDate = calculateDueDate();
    const newLoan: Loan = {
      loan_id: loanId,
      lender_id: currentUser.id,
      borrower_id: foundUser.id,
      borrower_phone: foundUser.phone_number,
      lender_name: currentUser.name,
      borrower_name: foundUser.name,
      lender_avatar: currentUser.avatar,
      borrower_avatar: foundUser.avatar,
      loan_amount: parseFloat(amount),
      interest_rate: parseFloat(interestRate) || 0,
      total_amount: totalAmount(),
      number_of_payments: parseInt(numPayments),
      payment_frequency: frequency,
      start_date: startDate,
      due_date: dueDate,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    addLoan(newLoan);
    addNotification({
      id: `notif_${Date.now()}`,
      type: "loan_request",
      title: "Loan Request Sent",
      message: `You sent a loan request to ${foundUser.name} for $${parseFloat(amount).toLocaleString()}`,
      loan_id: loanId,
      read: false,
      created_at: new Date().toISOString(),
    });
    selectLoan(loanId);
    navigate("dashboard");
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate("dashboard")} className="w-10 h-10 rounded-2xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
          <X className="w-5 h-5 text-white/60" />
        </button>
        <h2 className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
          New Loan
        </h2>
        <div className="w-10" />
      </div>

      {/* Step indicator */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s
                    ? "bg-[#00C9A7] text-[#0D1B2A]"
                    : step === s
                    ? "bg-[#00C9A7] text-[#0D1B2A]"
                    : "bg-[#1A2B3C] text-white/30 border border-white/10"
                }`}
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {step > s ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s ? "bg-[#00C9A7]" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {["Borrower", "Terms", "Review"].map((label, i) => (
            <span
              key={i}
              className={`text-[10px] font-semibold ${step === i + 1 ? "text-[#00C9A7]" : "text-white/30"}`}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="text-white text-lg font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Who are you lending to?</h3>
                <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Enter their phone number</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Enter phone number..."
                  value={borrowerPhone}
                  onChange={(e) => {
                    setBorrowerPhone(e.target.value);
                    setSearchError("");
                    setFoundUser(undefined);
                  }}
                  className="flex-1 h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00C9A7]/50"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
                <button
                  onClick={handleFindBorrower}
                  className="h-14 w-14 rounded-2xl bg-[#00C9A7] flex items-center justify-center flex-shrink-0"
                >
                  <Search className="w-5 h-5 text-[#0D1B2A]" />
                </button>
              </div>

              {searchError && (
                <p className="text-[#FF6B6B] text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{searchError}</p>
              )}

              {/* Demo numbers hint */}
              <div className="bg-[#1A2B3C]/60 border border-white/5 rounded-2xl p-3">
                <p className="text-white/30 text-xs mb-2 font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>Demo contacts:</p>
                <div className="space-y-1">
                  {[
                    { name: "Maria Garcia", phone: "5559876543" },
                    { name: "James Chen", phone: "5551234567" },
                    { name: "Sarah Miller", phone: "5554567890" },
                  ].map((c) => (
                    <button
                      key={c.phone}
                      onClick={() => {
                        setBorrowerPhone(c.phone);
                        setSearchError("");
                        setFoundUser(undefined);
                      }}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-white/50 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>{c.name}</span>
                      <span className="text-[#00C9A7]/60 text-xs font-mono">{c.phone}</span>
                    </button>
                  ))}
                </div>
              </div>

              {foundUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-[#00C9A7]/10 border border-[#00C9A7]/30 rounded-2xl p-4"
                >
                  <AvatarBadge initials={foundUser.avatar || foundUser.name.slice(0, 2)} size="md" />
                  <div>
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{foundUser.name}</p>
                    <p className="text-white/40 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>{foundUser.phone_number}</p>
                  </div>
                  <Check className="w-5 h-5 text-[#00C9A7] ml-auto" />
                </motion.div>
              )}

              <button
                onClick={() => foundUser && setStep(2)}
                disabled={!foundUser}
                className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base disabled:opacity-30 active:scale-[0.98] transition-all mt-4"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <div>
                <h3 className="text-white text-lg font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Loan Terms</h3>
                <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Set the terms for this loan</p>
              </div>

              {/* Amount */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Loan Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00C9A7] font-bold text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-xl font-black focus:outline-none focus:border-[#00C9A7]/50"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Interest rate */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Interest Rate (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full h-14 px-4 pr-10 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-base focus:outline-none focus:border-[#00C9A7]/50"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-semibold">%</span>
                </div>
              </div>

              {/* Number of payments */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Number of Payments
                </label>
                <input
                  type="number"
                  value={numPayments}
                  onChange={(e) => setNumPayments(e.target.value)}
                  min="1"
                  className="w-full h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-base focus:outline-none focus:border-[#00C9A7]/50"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Payment Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {frequencies.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className={`h-12 rounded-2xl text-sm font-semibold transition-all ${
                        frequency === f.id
                          ? "bg-[#00C9A7] text-[#0D1B2A]"
                          : "bg-[#1A2B3C] text-white/50 border border-white/10"
                      }`}
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-base focus:outline-none focus:border-[#00C9A7]/50 [color-scheme:dark]"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white font-semibold text-base"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Back
                </button>
                <button
                  onClick={() => amount && setStep(3)}
                  disabled={!amount}
                  className="flex-1 h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base disabled:opacity-30"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Review
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="text-white text-lg font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Review & Send</h3>
                <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Confirm the loan details</p>
              </div>

              {/* Summary card */}
              <div className="bg-[#1A2B3C] border border-white/10 rounded-3xl p-5 space-y-4">
                {/* Parties */}
                <div className="flex items-center gap-3">
                  <AvatarBadge initials={currentUser?.avatar || "U"} size="md" />
                  <div className="flex-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Lender (You)</p>
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{currentUser?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AvatarBadge initials={foundUser?.avatar || "?"} size="md" />
                  <div className="flex-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>Borrower</p>
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{foundUser?.name}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-3">
                  {[
                    { label: "Loan Amount", value: `$${parseFloat(amount).toLocaleString()}` },
                    { label: "Interest Rate", value: interestRate ? `${interestRate}%` : "0% (no interest)" },
                    { label: "Total Amount", value: `$${totalAmount().toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                    { label: "Payments", value: `${numPayments} × ${frequency}` },
                    { label: "Per Payment", value: `$${(totalAmount() / parseInt(numPayments)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                    { label: "Start Date", value: new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    { label: "Due Date", value: new Date(calculateDueDate()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{label}</span>
                      <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Total highlight */}
                <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/20 rounded-2xl p-3 flex justify-between items-center">
                  <span className="text-[#00C9A7] font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Total to Repay</span>
                  <span className="text-[#00C9A7] text-xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ${totalAmount().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-14 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white font-semibold text-base"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[#00C9A7]/20"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Send Request
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
