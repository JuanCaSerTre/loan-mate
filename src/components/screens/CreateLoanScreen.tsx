import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, BookUser, ChevronRight, Users, CalendarDays, TrendingUp, Wallet, Clock, ShieldAlert, ShieldCheck, AlertTriangle, Crown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PaymentFrequency } from "@/types/loan";
import AvatarBadge from "@/components/shared/AvatarBadge";
import { calculateTotalAmount, calculateDueDate, generatePaymentSchedule } from "@/lib/calculations";
import { useContacts } from "@/hooks/useContacts";
import { usePaywall } from "@/hooks/usePaywall";
import PaywallModal from "@/components/shared/PaywallModal";
import { LoanMateFriend } from "@/types/contact";
import { SUBSCRIPTION } from "@/config/constants";
import { toast } from "sonner";
import * as db from "@/services/api/supabaseDataService";

type Step = 1 | 2 | 3;

export default function CreateLoanScreen() {
  const { navigate, currentUser, findUserByPhone, createLoan, users, loans, validateLoanCreation } = useApp();
  const {
    canCreateLoan,
    hasReachedFreeLimit,
    activeLoansCount,
    startCheckout,
    isCheckoutLoading,
    isPaywallOpen,
    paywallTrigger,
    guardCreateLoan,
    closePaywall,
  } = usePaywall(currentUser, loans);
  const [step, setStep] = useState<Step>(1);
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [foundUser, setFoundUser] = useState<ReturnType<typeof findUserByPhone>>(undefined);
  const [searchError, setSearchError] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [numPayments, setNumPayments] = useState("3");
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Contact syncing for the inline contact picker
  const {
    permissionStatus: contactPermission,
    isLoaded: contactsLoaded,
    isSyncing: contactsSyncing,
    requestPermissionAndSync: syncContacts,
    filteredFriends: contactFriends,
    searchQuery: contactSearch,
    setSearchQuery: setContactSearch,
  } = useContacts(users, currentUser?.id || "");

  const frequencies: { id: PaymentFrequency; label: string }[] = [
    { id: "weekly", label: "Weekly" },
    { id: "biweekly", label: "Biweekly" },
    { id: "monthly", label: "Monthly" },
  ];

  // Live calculation values derived from inputs
  const parsedAmount = parseFloat(amount) || 0;
  const parsedRate = parseFloat(interestRate) || 0;
  const parsedPayments = Math.max(1, parseInt(numPayments) || 1);

  const totalAmount = useMemo(() => {
    if (parsedAmount <= 0) return 0;
    return calculateTotalAmount(parsedAmount, parsedRate);
  }, [parsedAmount, parsedRate]);

  const interestAmount = useMemo(() => Math.round((totalAmount - parsedAmount) * 100) / 100, [totalAmount, parsedAmount]);

  const perPayment = useMemo(() => {
    if (totalAmount <= 0 || parsedPayments <= 0) return 0;
    return Math.round((totalAmount / parsedPayments) * 100) / 100;
  }, [totalAmount, parsedPayments]);

  const dueDate = useMemo(() => {
    return calculateDueDate(startDate, parsedPayments, frequency);
  }, [startDate, parsedPayments, frequency]);

  const nextPaymentDate = useMemo(() => {
    const daysPerPeriod = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
    const start = new Date(startDate);
    const next = new Date(start.getTime() + daysPerPeriod * 24 * 60 * 60 * 1000);
    return next.toISOString().split("T")[0];
  }, [startDate, frequency]);

  const paymentSchedule = useMemo(() => {
    if (parsedAmount <= 0 || parsedPayments <= 0) return [];
    return generatePaymentSchedule(parsedAmount, parsedRate, parsedPayments, frequency, startDate);
  }, [parsedAmount, parsedRate, parsedPayments, frequency, startDate]);

  const handleFindBorrower = async () => {
    if (!borrowerPhone.trim()) {
      setSearchError("Enter a phone number");
      return;
    }
    
    setIsSearchingUser(true);
    try {
      // First try local lookup
      const user = findUserByPhone(borrowerPhone);
      if (user) {
        if (user.id === currentUser?.id) {
          setSearchError("You can't create a loan with yourself");
          setFoundUser(undefined);
        } else {
          setFoundUser(user);
          setSearchError("");
        }
        return;
      }

      // If not found locally, search Supabase
      const supabaseUser = await db.getUserByPhone(borrowerPhone);
      if (!supabaseUser) {
        setSearchError("No user found with this number");
        setFoundUser(undefined);
        return;
      }
      
      if (supabaseUser.id === currentUser?.id) {
        setSearchError("You can't create a loan with yourself");
        setFoundUser(undefined);
        return;
      }

      setFoundUser(supabaseUser);
      setSearchError("");
    } catch (err) {
      console.error("Error searching for user:", err);
      setSearchError("Error searching for user");
      setFoundUser(undefined);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleSelectContact = (friend: LoanMateFriend) => {
    const user = findUserByPhone(friend.userPhone);
    if (user) {
      setFoundUser(user);
      setBorrowerPhone(friend.userPhone);
      setSearchError("");
      setShowContactPicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!foundUser || !currentUser) return;

    // Check free loan limit via paywall guard
    if (!guardCreateLoan()) {
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Invalid loan amount");
      return;
    }

    // Run security validation
    const validation = validateLoanCreation({
      borrower: foundUser,
      amount: parsedAmount,
      interestRate: parsedRate,
      numberOfPayments: parsedPayments,
    });

    if (!validation.allowed) {
      setSecurityError(validation.reason || "Loan creation blocked by security policy.");
      toast.error("Loan blocked", { description: validation.reason });
      return;
    }

    // Show warnings but proceed
    if (validation.warnings.length > 0) {
      setSecurityWarnings(validation.warnings);
    }

    const loanId = await createLoan({
      borrower: foundUser,
      amount: parsedAmount,
      interestRate: parsedRate,
      numberOfPayments: parsedPayments,
      paymentFrequency: frequency,
      startDate: startDate,
      dueDate: dueDate,
    });

    if (!loanId) {
      setSecurityError("Loan creation was blocked. Please check the details and try again.");
      toast.error("Loan creation failed");
      return;
    }

    toast.success("Loan request sent!", {
      description: `$${parsedAmount.toLocaleString()} to ${foundUser.name}`,
    });

    navigate("dashboard");
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate("dashboard")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-gray-900 font-bold text-base">
          New Loan
        </h2>
        <div className="w-10" />
      </div>

      {/* Step indicator */}
      <div className="px-5 py-4 bg-white">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s
                    ? "bg-emerald-500 text-white"
                    : step === s
                    ? "bg-[#1B2E4B] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 flex-1 rounded-full transition-all ${step > s ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {["Borrower", "Terms", "Review"].map((label, i) => (
            <span
              key={i}
              className={`text-[10px] font-semibold ${step === i + 1 ? "text-[#1B2E4B]" : "text-gray-400"}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Free limit warning */}
      {hasReachedFreeLimit && (
        <div className="mx-5 mb-2">
          <button
            onClick={() => guardCreateLoan()}
            className="w-full flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 active:scale-[0.99] transition-transform"
          >
            <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 text-xs font-medium flex-1 text-left">
              You've reached the free plan limit ({SUBSCRIPTION.FREE_LOAN_LIMIT} active loans). Upgrade to continue.
            </p>
          </button>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
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
                <h3 className="text-gray-900 text-lg font-bold mb-1">Who are you lending to?</h3>
                <p className="text-gray-500 text-sm">Enter their phone number or pick a contact</p>
              </div>

              {/* Pick from contacts button */}
              <button
                onClick={() => {
                  if (contactPermission !== "granted") {
                    syncContacts();
                  }
                  setShowContactPicker(!showContactPicker);
                }}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1B2E4B]/5 flex items-center justify-center">
                  <BookUser className="w-5 h-5 text-[#1B2E4B]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-gray-900 text-sm font-semibold">Pick from Contacts</p>
                  <p className="text-gray-400 text-xs">
                    {contactsLoaded
                      ? `${contactFriends.length} friend${contactFriends.length !== 1 ? "s" : ""} on JUCA`
                      : "Sync contacts to find friends"}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showContactPicker ? "rotate-90" : ""}`} />
              </button>

              {/* Inline Contact Picker */}
              <AnimatePresence>
                {showContactPicker && contactPermission === "granted" && contactsLoaded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      {/* Search within contacts */}
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B2E4B]/30"
                          />
                        </div>
                      </div>
                      {/* Contact list */}
                      <div className="max-h-48 overflow-y-auto">
                        {contactFriends.length === 0 ? (
                          <div className="flex flex-col items-center py-6">
                            <Users className="w-6 h-6 text-gray-300 mb-2" />
                            <p className="text-gray-400 text-xs">
                              {contactSearch ? "No matches" : "No JUCA friends found"}
                            </p>
                          </div>
                        ) : (
                          contactFriends.map((friend) => (
                            <button
                              key={friend.userId}
                              onClick={() => handleSelectContact(friend)}
                              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <AvatarBadge
                                initials={friend.userAvatar || friend.userName.slice(0, 2)}
                                size="sm"
                              />
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-gray-900 text-sm font-semibold truncate">
                                  {friend.userName}
                                </p>
                                <p className="text-gray-400 text-[11px] truncate">
                                  {friend.contact.name} · {friend.contact.phoneNumbers[0]}
                                </p>
                              </div>
                              <Check className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs font-medium">or enter phone number</span>
                <div className="flex-1 h-px bg-gray-200" />
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
                  className="flex-1 h-14 px-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
                />
                <button
                  onClick={handleFindBorrower}
                  disabled={isSearchingUser}
                  className="h-14 w-14 rounded-2xl bg-[#1B2E4B] flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                >
                  {isSearchingUser ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {searchError && (
                <p className="text-red-500 text-sm">{searchError}</p>
              )}

              {/* Demo numbers hint */}
              <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                <p className="text-gray-400 text-xs mb-2 font-semibold">Demo contacts:</p>
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
                      className="flex items-center justify-between w-full text-left py-1"
                    >
                      <span className="text-gray-600 text-xs">{c.name}</span>
                      <span className="text-gray-400 text-xs font-mono">{c.phone}</span>
                    </button>
                  ))}
                </div>
              </div>

              {foundUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
                >
                  <AvatarBadge initials={foundUser.avatar || foundUser.name.slice(0, 2)} size="md" />
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{foundUser.name}</p>
                    <p className="text-gray-500 text-xs">{foundUser.phone_number}</p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-500 ml-auto" />
                </motion.div>
              )}

              <button
                onClick={() => foundUser && setStep(2)}
                disabled={!foundUser}
                className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base disabled:opacity-30 active:scale-[0.98] transition-all mt-4 shadow-lg shadow-[#1B2E4B]/20"
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
                <h3 className="text-gray-900 text-lg font-bold mb-1">Loan Terms</h3>
                <p className="text-gray-500 text-sm">Set the terms for this loan</p>
              </div>

              {/* Amount */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Loan Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B2E4B] font-bold text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 rounded-2xl bg-white border border-gray-200 text-gray-900 text-xl font-bold focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                {/* Quick amount presets */}
                <div className="flex gap-2 mt-2">
                  {[50, 100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(String(preset))}
                      className={`flex-1 h-9 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                        amount === String(preset)
                          ? "bg-[#1B2E4B] text-white"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-[#1B2E4B]/30"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest rate */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Interest Rate (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full h-14 px-4 pr-10 rounded-2xl bg-white border border-gray-200 text-gray-900 text-base focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                </div>
              </div>

              {/* Number of payments */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Number of Payments
                </label>
                <input
                  type="number"
                  value={numPayments}
                  onChange={(e) => setNumPayments(e.target.value)}
                  min="1"
                  className="w-full h-14 px-4 rounded-2xl bg-white border border-gray-200 text-gray-900 text-base focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Payment Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {frequencies.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className={`h-12 rounded-2xl text-sm font-semibold transition-all ${
                        frequency === f.id
                          ? "bg-[#1B2E4B] text-white"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl bg-white border border-gray-200 text-gray-900 text-base focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
                />
              </div>

              {/* Live Repayment Summary — always show when amount entered */}
              <AnimatePresence>
                {parsedAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#1B2E4B] rounded-2xl p-4 space-y-3"
                  >
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                      Live Repayment Summary
                    </p>

                    {/* Main amounts row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Wallet className="w-3 h-3 text-white/50" />
                          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Total Repayment</p>
                        </div>
                        <p className="text-white text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CalendarDays className="w-3 h-3 text-white/50" />
                          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Per Payment</p>
                        </div>
                        <p className="text-white text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          ${perPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown rows */}
                    <div className="space-y-2 border-t border-white/10 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-xs">Principal</span>
                        <span className="text-white/80 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          ${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {parsedRate > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400 text-xs">Interest ({parsedRate}%)</span>
                          </div>
                          <span className="text-amber-400 text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            +${interestAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-xs">Schedule</span>
                        <span className="text-white/80 text-xs font-semibold">
                          {parsedPayments} × {frequency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">First Payment</span>
                        </div>
                        <span className="text-emerald-400 text-xs font-semibold">
                          {new Date(nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-xs">Final Due Date</span>
                        <span className="text-white/80 text-xs font-semibold">
                          {new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-2xl bg-white border border-gray-200 text-gray-700 font-semibold text-base"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (amount && foundUser) {
                      // Pre-validate before moving to review
                      const preCheck = validateLoanCreation({
                        borrower: foundUser,
                        amount: parsedAmount,
                        interestRate: parsedRate,
                        numberOfPayments: parsedPayments,
                      });
                      setSecurityWarnings(preCheck.warnings);
                      if (!preCheck.allowed) {
                        setSecurityError(preCheck.reason || "Blocked");
                      } else {
                        setSecurityError(null);
                      }
                      setStep(3);
                    }
                  }}
                  disabled={!amount}
                  className="flex-1 h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base disabled:opacity-30"
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
                <h3 className="text-gray-900 text-lg font-bold mb-1">Review & Send</h3>
                <p className="text-gray-500 text-sm">Confirm the loan details before sending</p>
              </div>

              {/* Summary card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
                {/* Parties */}
                <div className="flex items-center gap-3">
                  <AvatarBadge initials={currentUser?.avatar || "U"} size="md" />
                  <div className="flex-1">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Lender (You)</p>
                    <p className="text-gray-900 font-semibold text-sm">{currentUser?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AvatarBadge initials={foundUser?.avatar || "?"} size="md" />
                  <div className="flex-1">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Borrower</p>
                    <p className="text-gray-900 font-semibold text-sm">{foundUser?.name}</p>
                  </div>
                </div>

                {/* Repayment highlight */}
                <div className="bg-[#1B2E4B] rounded-2xl p-4">
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-3">Repayment Summary</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-white/50 text-[10px] mb-1">Principal</p>
                      <p className="text-white font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    {parsedRate > 0 && (
                      <div className="text-center">
                        <p className="text-amber-400/70 text-[10px] mb-1">Interest</p>
                        <p className="text-amber-400 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          +${interestAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <div className={parsedRate > 0 ? "text-center" : "text-center col-span-2"}>
                      <p className="text-emerald-400/70 text-[10px] mb-1">Total</p>
                      <p className="text-emerald-400 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-white/10 rounded-xl py-2.5">
                    <span className="text-white/70 text-xs font-semibold">{parsedPayments} payments of</span>
                    <span className="text-white font-bold text-base" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ${perPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-white/50 text-xs">/ {frequency}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2.5">
                  {[
                    { label: "Start Date", value: new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    { label: "First Payment", value: new Date(nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    { label: "Final Due Date", value: new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-400 text-sm">{label}</span>
                      <span className="text-gray-900 font-semibold text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Schedule */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#1B2E4B]" />
                    <span className="text-gray-900 font-semibold text-sm">Payment Schedule</span>
                    <span className="bg-[#1B2E4B]/10 text-[#1B2E4B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {paymentSchedule.length} payments
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showSchedule ? "rotate-90" : ""}`} />
                </button>

                <AnimatePresence>
                  {showSchedule && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                        {paymentSchedule.map((p, i) => (
                          <div
                            key={p.paymentNumber}
                            className="flex items-center px-5 py-3 border-b border-gray-50 last:border-0"
                          >
                            <div className="w-6 h-6 rounded-full bg-[#1B2E4B]/10 flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-[#1B2E4B] text-[10px] font-bold">{p.paymentNumber}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 text-xs font-semibold">
                                {new Date(p.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </p>
                              <p className="text-gray-400 text-[10px]">
                                {i === 0 ? "First payment" : i === paymentSchedule.length - 1 ? "Final payment" : `Payment ${p.paymentNumber}`}
                              </p>
                            </div>
                            <span className="text-[#1B2E4B] font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              ${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Security Warnings */}
              <AnimatePresence>
                {securityWarnings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-amber-800 text-xs font-semibold uppercase tracking-wider">Security Warnings</p>
                    </div>
                    {securityWarnings.map((w, i) => (
                      <p key={i} className="text-amber-700 text-xs pl-6">• {w}</p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security Error */}
              <AnimatePresence>
                {securityError && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 text-xs font-semibold mb-1">Blocked by Security</p>
                        <p className="text-red-600 text-xs">{securityError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security Badge */}
              {!securityError && (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 text-[10px] font-semibold">Protected by JUCA Security</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(2);
                    setSecurityError(null);
                    setSecurityWarnings([]);
                  }}
                  className="flex-1 h-14 rounded-2xl bg-white border border-gray-200 text-gray-700 font-semibold text-base"
                >
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!!securityError}
                  className="flex-1 h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[#1B2E4B]/20 disabled:opacity-30"
                >
                  Send Request
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={closePaywall}
        onUpgrade={async (plan) => {
          await startCheckout(plan);
          closePaywall();
        }}
        isLoading={isCheckoutLoading}
        trigger={paywallTrigger}
        activeLoansCount={activeLoansCount}
      />
    </div>
  );
}
