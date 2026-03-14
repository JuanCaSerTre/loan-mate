import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { User, Loan, Payment, Notification } from "@/types/loan";
import {
  calculateTotalAmount,
} from "@/lib/calculations";
import { securityService } from "@/services/securityService";
import { apiClient } from "@/services/api/client";
import type { SecurityValidationResult } from "@/services/securityService";
import {
  identifyUser,
  clearUser,
  trackDailyActiveUser,
  trackLoanCreated,
  trackLoanAccepted,
  trackLoanRejected,
  trackPaymentRegistered,
  trackPaymentConfirmed,
  trackLoanCompleted,
} from "@/services/analyticsService";
import * as db from "@/services/api/supabaseDataService";
import { setupPaymentReminderSchedule } from "@/services/paymentReminderScheduler";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type AppScreen =
  | "splash"
  | "login"
  | "onboarding"
  | "terms"
  | "dashboard"
  | "loans"
  | "create-loan"
  | "loan-details"
  | "loan-request"
  | "register-payment"
  | "notifications"
  | "contacts"
  | "profile";

interface AppState {
  currentScreen: AppScreen;
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoadingData: boolean;
  loans: Loan[];
  payments: Payment[];
  notifications: Notification[];
  users: User[];
  selectedLoanId: string | null;
  selectedPaymentId: string | null;
  /** ISO timestamp of when the user last accepted terms; null if not yet accepted. */
  termsAcceptedAt: string | null;
}

interface LoanComputedData {
  confirmedPayments: Payment[];
  confirmedAmount: number;
  remainingBalance: number;
  progress: number;
  scheduledPaymentAmount: number;
  isComplete: boolean;
}

interface AppContextType extends AppState {
  navigate: (screen: AppScreen) => void;
  login: (user: User) => Promise<void>;
  logout: () => void;
  /** Accept terms & privacy policy — records timestamp and navigates to dashboard. */
  acceptTerms: () => void;
  selectLoan: (loanId: string) => void;
  selectPayment: (paymentId: string) => void;
  /** Reload all data from Supabase */
  refreshData: () => Promise<void>;
  createLoan: (params: {
    borrower: User;
    amount: number;
    interestRate: number;
    numberOfPayments: number;
    paymentFrequency: Loan["payment_frequency"];
    startDate: string;
    dueDate: string;
  }) => Promise<string | null>;
  acceptLoan: (loanId: string) => void;
  declineLoan: (loanId: string) => void;
  registerPayment: (params: {
    loanId: string;
    amount: number;
    paymentDate: string;
    note?: string;
  }) => Promise<SecurityValidationResult | null>;
  confirmPayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string) => void;
  addLoan: (loan: Loan) => void;
  addPayment: (payment: Payment) => void;
  updateLoanStatus: (loanId: string, status: Loan["status"]) => void;
  updatePaymentStatus: (paymentId: string, status: Payment["status"]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Notification) => void;
  getUnreadCount: () => number;
  getLoanById: (id: string) => Loan | undefined;
  getPaymentsForLoan: (loanId: string) => Payment[];
  getLoanComputed: (loanId: string) => LoanComputedData;
  getUserById: (id: string) => User | undefined;
  findUserByPhone: (phone: string) => User | undefined;
  getTotalLent: () => number;
  getTotalBorrowed: () => number;
  getPendingActions: () => number;
  getPendingLoanRequests: () => Loan[];
  getPendingPaymentConfirmations: () => Payment[];
  /** Security: Validate a loan before creation without side effects. */
  validateLoanCreation: (params: {
    borrower: User;
    amount: number;
    interestRate: number;
    numberOfPayments: number;
  }) => SecurityValidationResult;
  /** Security: Validate a payment before registration without side effects. */
  validatePaymentRegistration: (params: {
    loanId: string;
    amount: number;
  }) => SecurityValidationResult;
  /** Security: Get recent security activity log. */
  getSecurityLog: () => ReturnType<typeof securityService.getActivityLog>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentScreen: "splash",
    currentUser: null,
    isAuthenticated: false,
    isLoadingData: false,
    loans: [],
    payments: [],
    notifications: [],
    users: [],
    selectedLoanId: null,
    selectedPaymentId: null,
    termsAcceptedAt: localStorage.getItem("juca_terms_accepted_at") ?? null,
  });

  const navigate = useCallback((screen: AppScreen) => {
    setState((prev) => ({ ...prev, currentScreen: screen }));
  }, []);

  // Auto-restore session from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("juca_user_id");
    if (storedUserId) {
      // Attempt to restore session by fetching user from Supabase
      db.getUserById(storedUserId).then((user) => {
        if (user) {
          login(user);
        } else {
          // Stored user no longer exists — clear and show login
          localStorage.removeItem("juca_user_id");
          setState((prev) => ({ ...prev, currentScreen: "login" }));
        }
      }).catch(() => {
        localStorage.removeItem("juca_user_id");
        setState((prev) => ({ ...prev, currentScreen: "login" }));
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (user: User) => {
    // Persist user ID for session restoration
    localStorage.setItem("juca_user_id", user.id);

    // Issue auth token and configure API client
    const token = securityService.generateToken(user.id);
    apiClient.setTokenProvider(() => securityService.getTokenString());
    apiClient.setAuthToken(token.token);

    // Analytics: identify the user and record daily active user
    identifyUser(user.id, { name: user.name });
    trackDailyActiveUser(user.id);

    // Determine whether the user still needs to see the terms screen
    const storedAcceptance = localStorage.getItem("juca_terms_accepted_at");

    // Set authenticated state immediately so the UI responds
    setState((prev) => ({
      ...prev,
      currentUser: user,
      isAuthenticated: true,
      isLoadingData: true,
      termsAcceptedAt: storedAcceptance,
      currentScreen: storedAcceptance ? "dashboard" : "terms",
    }));

    // Load real data from Supabase (only if user has an actual id)
    if (user.id) {
      try {
        const [loans, payments, notifications, allUsers] = await Promise.all([
          db.getLoansForUser(user.id),
          db.getPaymentsForUser(user.id),
          db.getNotificationsForUser(user.id),
          db.getAllUsers(),
        ]);

        // Ensure the current user is always in the users list
        const userInList = allUsers.some((u) => u.id === user.id);
        const finalUsers = userInList ? allUsers : [user, ...allUsers];

        setState((prev) => ({
          ...prev,
          loans,
          payments,
          notifications,
          users: finalUsers,
          isLoadingData: false,
        }));
      } catch (err) {
        console.error("[login] Failed to load data from Supabase:", err);
        setState((prev) => ({ ...prev, isLoadingData: false }));
      }
    }
  }, []);

  /** Reload all data from Supabase (pull-to-refresh / manual refresh) */
  const refreshData = useCallback(async () => {
    setState((prev) => {
      if (!prev.currentUser) return prev;
      return { ...prev, isLoadingData: true };
    });

    let userId: string | null = null;
    setState((prev) => {
      userId = prev.currentUser?.id ?? null;
      return prev;
    });

    if (!userId) {
      setState((prev) => ({ ...prev, isLoadingData: false }));
      return;
    }

    try {
      const [loans, payments, notifications, allUsers] = await Promise.all([
        db.getLoansForUser(userId),
        db.getPaymentsForUser(userId),
        db.getNotificationsForUser(userId),
        db.getAllUsers(),
      ]);

      setState((prev) => {
        if (!prev.currentUser) return { ...prev, isLoadingData: false };
        const userInList = allUsers.some((u) => u.id === prev.currentUser!.id);
        const finalUsers = userInList ? allUsers : [prev.currentUser, ...allUsers];
        return {
          ...prev,
          loans,
          payments,
          notifications,
          users: finalUsers,
          isLoadingData: false,
        };
      });
    } catch (err) {
      console.error("[refreshData] Failed:", err);
      setState((prev) => ({ ...prev, isLoadingData: false }));
    }
  }, []);

  const acceptTerms = useCallback(() => {
    const timestamp = new Date().toISOString();
    // Persist acceptance so it survives page refresh
    localStorage.setItem("juca_terms_accepted_at", timestamp);

    setState((prev) => {
      securityService.logEvent({
        type: "terms_accepted",
        userId: prev.currentUser?.id ?? "unknown",
        message: `User accepted Terms of Service and Privacy Policy at ${timestamp}`,
        severity: "info",
        metadata: { timestamp },
      });
      return {
        ...prev,
        termsAcceptedAt: timestamp,
        currentScreen: "dashboard",
      };
    });
  }, []);

  const logout = useCallback(() => {
    // Clear session
    localStorage.removeItem("juca_user_id");

    // Clear auth token and API client auth
    securityService.clearToken();
    apiClient.clearAuthToken();

    // Analytics: clear identity
    clearUser();

    setState((prev) => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false,
      currentScreen: "login",
    }));
  }, []);

  const selectLoan = useCallback((loanId: string) => {
    setState((prev) => ({ ...prev, selectedLoanId: loanId }));
  }, []);

  const selectPayment = useCallback((paymentId: string) => {
    setState((prev) => ({ ...prev, selectedPaymentId: paymentId }));
  }, []);

  const addLoan = useCallback((loan: Loan) => {
    setState((prev) => ({ ...prev, loans: [...prev.loans, loan] }));
  }, []);

  const addPayment = useCallback((payment: Payment) => {
    setState((prev) => ({ ...prev, payments: [...prev.payments, payment] }));
  }, []);

  const updateLoanStatus = useCallback(
    (loanId: string, status: Loan["status"]) => {
      setState((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.loan_id === loanId ? { ...l, status } : l
        ),
      }));
    },
    []
  );

  const updatePaymentStatus = useCallback(
    (paymentId: string, status: Payment["status"]) => {
      setState((prev) => ({
        ...prev,
        payments: prev.payments.map((p) =>
          p.payment_id === paymentId ? { ...p, status } : p
        ),
      }));
    },
    []
  );

  // ─── Loan Creation Flow (with security) ─────────────────────────
  const createLoan = useCallback(
    async (params: {
      borrower: User;
      amount: number;
      interestRate: number;
      numberOfPayments: number;
      paymentFrequency: Loan["payment_frequency"];
      startDate: string;
      dueDate: string;
    }): Promise<string | null> => {
      // We need to read current state synchronously for validation
      let currentState: AppState | null = null;
      setState((prev) => {
        currentState = prev;
        return prev; // don't modify
      });

      if (!currentState) return null;
      const cs = currentState as AppState;
      if (!cs.currentUser) return null;

      // Run comprehensive security validation
      const validation = securityService.validateLoanInput({
        userId: cs.currentUser.id,
        borrowerId: params.borrower.id,
        amount: params.amount,
        interestRate: params.interestRate,
        numberOfPayments: params.numberOfPayments,
        existingLoans: cs.loans,
      });

      if (!validation.allowed) {
        return null;
      }

      // Sanitize note-like fields
      const sanitizedAmount = securityService.sanitizeAmount(params.amount.toString());
      const totalAmount = calculateTotalAmount(sanitizedAmount, params.interestRate);

      // Persist to Supabase first to get the real UUID
      const savedLoan = await db.createLoan({
        lender_id: cs.currentUser.id,
        borrower_id: params.borrower.id,
        borrower_phone: params.borrower.phone_number,
        loan_amount: sanitizedAmount,
        interest_rate: params.interestRate,
        total_amount: totalAmount,
        number_of_payments: params.numberOfPayments,
        payment_frequency: params.paymentFrequency,
        start_date: params.startDate,
        due_date: params.dueDate,
        lender_name: cs.currentUser.name,
        borrower_name: params.borrower.name,
        lender_avatar: cs.currentUser.avatar,
        borrower_avatar: params.borrower.avatar,
      });

      // Fallback to local-only if Supabase fails
      const loanId = savedLoan?.loan_id ?? `loan_${Date.now()}`;
      const newLoan: Loan = savedLoan ?? {
        loan_id: loanId,
        lender_id: cs.currentUser.id,
        borrower_id: params.borrower.id,
        borrower_phone: params.borrower.phone_number,
        lender_name: cs.currentUser.name,
        borrower_name: params.borrower.name,
        lender_avatar: cs.currentUser.avatar,
        borrower_avatar: params.borrower.avatar,
        loan_amount: sanitizedAmount,
        interest_rate: params.interestRate,
        total_amount: totalAmount,
        number_of_payments: params.numberOfPayments,
        payment_frequency: params.paymentFrequency,
        start_date: params.startDate,
        due_date: params.dueDate,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      // Save notifications to Supabase
      await Promise.all([
        db.createNotification({
          user_id: cs.currentUser.id,
          type: "loan_request_received",
          title: "Loan Request Sent",
          description: `You sent a loan request to ${params.borrower.name} for $${sanitizedAmount.toLocaleString()}`,
          loan_id: loanId,
        }),
        db.createNotification({
          user_id: params.borrower.id,
          type: "loan_request_received",
          title: "New Loan Request",
          description: `${cs.currentUser.name} wants to lend you $${sanitizedAmount.toLocaleString()}`,
          loan_id: loanId,
        }),
      ]);

      setState((prev) => {
        if (!prev.currentUser) return prev;

        const lenderNotif: Notification = {
          id: `notif_${Date.now()}_lender`,
          type: "loan_request",
          title: "Loan Request Sent",
          message: `You sent a loan request to ${params.borrower.name} for $${sanitizedAmount.toLocaleString()}`,
          loan_id: loanId,
          read: false,
          created_at: new Date().toISOString(),
        };

        // NOTE: borrowerNotif is saved to Supabase above and will be loaded
        // when the borrower logs in. Do NOT add it to the lender's local state
        // to avoid the lender receiving the borrower's push notification.

        securityService.logEvent({
          type: "loan_created",
          userId: prev.currentUser!.id,
          message: `Loan created: $${sanitizedAmount.toLocaleString()} to ${params.borrower.name}`,
          severity: "info",
          metadata: { loanId, amount: sanitizedAmount, borrowerId: params.borrower.id, interestRate: params.interestRate },
        });

        trackLoanCreated({
          loanId,
          amount: sanitizedAmount,
          interestRate: params.interestRate,
          numberOfPayments: params.numberOfPayments,
          paymentFrequency: params.paymentFrequency,
        });

        return {
          ...prev,
          loans: [...prev.loans, newLoan],
          notifications: [lenderNotif, ...prev.notifications],
          selectedLoanId: loanId,
        };
      });

      return loanId;
    },
    []
  );

  // ─── Loan Accept/Decline ───────────────────────────────────────
  const acceptLoan = useCallback((loanId: string) => {
    let loanSnapshot: Loan | undefined;
    setState((prev) => {
      const loan = prev.loans.find((l) => l.loan_id === loanId);
      if (!loan || loan.status !== "pending") return prev;
      loanSnapshot = loan;

      const updatedLoans = prev.loans.map((l) =>
        l.loan_id === loanId ? { ...l, status: "active" as const } : l
      );

      // Notification for the borrower (they're the one accepting)
      const borrowerNotif: Notification = {
        id: `notif_${Date.now()}_accept`,
        type: "loan_accepted",
        title: "Loan Accepted",
        message: `You accepted the loan of $${loan.loan_amount.toLocaleString()} from ${loan.lender_name}`,
        loan_id: loanId,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Notification for the lender
      const lenderNotif: Notification = {
        id: `notif_${Date.now()}_accept_lender`,
        type: "loan_accepted",
        title: "Loan Accepted!",
        message: `${loan.borrower_name} accepted your loan of $${loan.loan_amount.toLocaleString()}. The loan is now active.`,
        loan_id: loanId,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Only add the current user's (borrower's) notification to local state.
      // lenderNotif is saved to Supabase and will appear when the lender loads their data.
      return {
        ...prev,
        loans: updatedLoans,
        notifications: [borrowerNotif, ...prev.notifications],
      };
    });
    if (loanSnapshot) {
      // Persist to Supabase
      db.updateLoanStatus(loanId, "active");
      db.createNotification({ user_id: loanSnapshot.borrower_id, type: "loan_accepted", title: "Loan Accepted", description: `You accepted the loan of $${loanSnapshot.loan_amount.toLocaleString()} from ${loanSnapshot.lender_name}`, loan_id: loanId });
      db.createNotification({ user_id: loanSnapshot.lender_id, type: "loan_accepted", title: "Loan Accepted!", description: `${loanSnapshot.borrower_name} accepted your loan of $${loanSnapshot.loan_amount.toLocaleString()}.`, loan_id: loanId });
      trackLoanAccepted(loanId, loanSnapshot.loan_amount);
    }
  }, []);

  const declineLoan = useCallback((loanId: string) => {
    let loanSnapshot: Loan | undefined;
    setState((prev) => {
      const loan = prev.loans.find((l) => l.loan_id === loanId);
      if (!loan || loan.status !== "pending") return prev;
      loanSnapshot = loan;

      const updatedLoans = prev.loans.map((l) =>
        l.loan_id === loanId ? { ...l, status: "declined" as const } : l
      );

      const borrowerNotif: Notification = {
        id: `notif_${Date.now()}_decline`,
        type: "loan_declined",
        title: "Loan Declined",
        message: `You declined the loan of $${loan.loan_amount.toLocaleString()} from ${loan.lender_name}`,
        loan_id: loanId,
        read: false,
        created_at: new Date().toISOString(),
      };

      const lenderNotif: Notification = {
        id: `notif_${Date.now()}_decline_lender`,
        type: "loan_declined",
        title: "Loan Declined",
        message: `${loan.borrower_name} declined your loan of $${loan.loan_amount.toLocaleString()}`,
        loan_id: loanId,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Only add the current user's (borrower's) notification to local state.
      // lenderNotif is saved to Supabase and will appear when the lender loads their data.
      return {
        ...prev,
        loans: updatedLoans,
        notifications: [borrowerNotif, ...prev.notifications],
      };
    });
    if (loanSnapshot) {
      // Persist to Supabase
      db.updateLoanStatus(loanId, "declined");
      db.createNotification({ user_id: loanSnapshot.borrower_id, type: "loan_declined", title: "Loan Declined", description: `You declined the loan from ${loanSnapshot.lender_name}`, loan_id: loanId });
      db.createNotification({ user_id: loanSnapshot.lender_id, type: "loan_declined", title: "Loan Declined", description: `${loanSnapshot.borrower_name} declined your loan of $${loanSnapshot.loan_amount.toLocaleString()}`, loan_id: loanId });
      trackLoanRejected(loanId, loanSnapshot.loan_amount);
    }
  }, []);

  // ─── Payment Registration (with security) ───────────────────────
  const registerPayment = useCallback(
    async (params: {
      loanId: string;
      amount: number;
      paymentDate: string;
      note?: string;
    }): Promise<SecurityValidationResult | null> => {
      let result: SecurityValidationResult | null = null;
      let currentState: AppState | null = null;

      setState((prev) => {
        currentState = prev;
        return prev;
      });

      if (!currentState) return null;
      const cs = currentState as AppState;
      if (!cs.currentUser) return null;

      const loan = cs.loans.find((l) => l.loan_id === params.loanId);
      if (!loan || loan.status !== "active") return null;

      const confirmedAmount = cs.payments
        .filter((p) => p.loan_id === params.loanId && p.status === "confirmed")
        .reduce((s, p) => s + p.amount, 0);
      const remaining = loan.total_amount - confirmedAmount;

      const validation = securityService.validatePaymentInput({
        userId: cs.currentUser.id,
        amount: params.amount,
        remainingBalance: remaining,
        existingPayments: cs.payments,
      });

      result = validation;

      if (!validation.allowed) {
        return result;
      }

      const clampedAmount = Math.min(
        securityService.sanitizeAmount(params.amount.toString()),
        remaining
      );
      const sanitizedNote = params.note
        ? securityService.sanitizeTextInput(params.note)
        : undefined;

      // Persist to Supabase first to get real UUID
      const savedPayment = await db.createPayment({
        loan_id: params.loanId,
        amount: clampedAmount,
        created_by_user_id: cs.currentUser.id,
        payment_date: params.paymentDate,
        note: sanitizedNote,
      });

      const paymentId = savedPayment?.payment_id ?? `pay_${Date.now()}`;
      const newPayment: Payment = savedPayment ?? {
        payment_id: paymentId,
        loan_id: params.loanId,
        amount: clampedAmount,
        created_by_user: cs.currentUser.id,
        status: "pending_confirmation",
        note: sanitizedNote,
        created_at: new Date().toISOString(),
        payment_date: params.paymentDate,
      };

      const isLender = loan.lender_id === cs.currentUser.id;
      const counterpartyId = isLender ? loan.borrower_id : loan.lender_id;
      const counterpartyName = isLender ? loan.borrower_name : loan.lender_name;

      // Save notifications to Supabase
      await Promise.all([
        db.createNotification({ user_id: cs.currentUser.id, type: "payment_registered", title: "Payment Registered", description: `You registered a payment of $${clampedAmount.toLocaleString()} for ${counterpartyName} to confirm`, loan_id: params.loanId, payment_id: paymentId }),
        db.createNotification({ user_id: counterpartyId, type: "payment_registered", title: "Payment Awaiting Confirmation", description: `${cs.currentUser.name} registered a payment of $${clampedAmount.toLocaleString()} — please confirm`, loan_id: params.loanId, payment_id: paymentId }),
      ]);

      setState((prev) => {
        if (!prev.currentUser) return prev;

        const senderNotif: Notification = {
          id: `notif_${Date.now()}_pay_sender`,
          type: "payment_registered",
          title: "Payment Registered",
          message: `You registered a payment of $${clampedAmount.toLocaleString()} for ${counterpartyName} to confirm`,
          loan_id: params.loanId,
          payment_id: paymentId,
          read: false,
          created_at: new Date().toISOString(),
        };

        const receiverNotif: Notification = {
          id: `notif_${Date.now()}_pay_receiver`,
          type: "payment_registered",
          title: "Payment Awaiting Confirmation",
          message: `${prev.currentUser!.name} registered a payment of $${clampedAmount.toLocaleString()} — please confirm`,
          loan_id: params.loanId,
          payment_id: paymentId,
          read: false,
          created_at: new Date().toISOString(),
        };

        securityService.logEvent({
          type: "payment_registered",
          userId: prev.currentUser!.id,
          message: `Payment registered: $${clampedAmount.toLocaleString()} for loan ${params.loanId}`,
          severity: "info",
          metadata: { paymentId, amount: clampedAmount, loanId: params.loanId },
        });

        trackPaymentRegistered({ paymentId, loanId: params.loanId, amount: clampedAmount });

        // Only add the current user's (lender's/sender's) notification to local state.
        // receiverNotif is saved to Supabase and will appear when the borrower loads their data.
        return {
          ...prev,
          payments: [...prev.payments, newPayment],
          notifications: [senderNotif, ...prev.notifications],
        };
      });

      return result;
    },
    []
  );

  // ─── Payment Confirm / Reject ──────────────────────────────────
  const checkAndCompleteLoan = (
    loans: Loan[],
    payments: Payment[],
    loanId: string
  ): { loans: Loan[]; completionNotifs: Notification[] } => {
    const loan = loans.find((l) => l.loan_id === loanId);
    if (!loan || loan.status !== "active") return { loans, completionNotifs: [] };

    const confirmedAmount = payments
      .filter((p) => p.loan_id === loanId && p.status === "confirmed")
      .reduce((s, p) => s + p.amount, 0);

    // Complete if paid in full (within $0.01 tolerance) OR all scheduled payments confirmed
    const confirmedCount = payments.filter(
      (p) => p.loan_id === loanId && p.status === "confirmed"
    ).length;
    const isPaidInFull = confirmedAmount >= loan.total_amount - 0.01;
    const allPaymentsMade = confirmedCount >= loan.number_of_payments;

    if (isPaidInFull || allPaymentsMade) {
      const updatedLoans = loans.map((l) =>
        l.loan_id === loanId ? { ...l, status: "completed" as const } : l
      );

      const completionNotifs: Notification[] = [
        {
          id: `notif_${Date.now()}_complete_lender`,
          type: "loan_accepted" as const,
          title: "🎉 Loan Completed!",
          message: `The loan with ${loan.borrower_name} for $${loan.loan_amount.toLocaleString()} has been fully repaid!`,
          loan_id: loanId,
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: `notif_${Date.now() + 1}_complete_borrower`,
          type: "loan_accepted" as const,
          title: "🎉 Loan Completed!",
          message: `Your loan of $${loan.loan_amount.toLocaleString()} from ${loan.lender_name} is fully repaid!`,
          loan_id: loanId,
          read: false,
          created_at: new Date().toISOString(),
        },
      ];

      return { loans: updatedLoans, completionNotifs };
    }

    return { loans, completionNotifs: [] };
  };

  const confirmPayment = useCallback((paymentId: string) => {
    let paymentSnapshot: Payment | undefined;
    let loanSnapshot: Loan | undefined;
    let wasCompleted = false;

    setState((prev) => {
      const payment = prev.payments.find((p) => p.payment_id === paymentId);
      if (!payment || payment.status !== "pending_confirmation") return prev;

      const loan = prev.loans.find((l) => l.loan_id === payment.loan_id);
      if (!loan) return prev;

      paymentSnapshot = payment;
      loanSnapshot = loan;

      const updatedPayments = prev.payments.map((p) =>
        p.payment_id === paymentId ? { ...p, status: "confirmed" as const } : p
      );

      const confirmerNotif: Notification = {
        id: `notif_${Date.now()}_confirm`,
        type: "payment_confirmed",
        title: "Payment Confirmed",
        message: `You confirmed a payment of $${payment.amount.toLocaleString()}`,
        loan_id: payment.loan_id,
        payment_id: paymentId,
        read: false,
        created_at: new Date().toISOString(),
      };

      const registrantNotif: Notification = {
        id: `notif_${Date.now()}_confirm_registrant`,
        type: "payment_confirmed",
        title: "Payment Confirmed!",
        message: `Your payment of $${payment.amount.toLocaleString()} was confirmed`,
        loan_id: payment.loan_id,
        payment_id: paymentId,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Check if the loan is now complete
      const { loans: updatedLoans, completionNotifs } = checkAndCompleteLoan(
        prev.loans,
        updatedPayments,
        payment.loan_id
      );

      // Track whether loan just completed
      const updatedLoan = updatedLoans.find((l) => l.loan_id === payment.loan_id);
      wasCompleted = updatedLoan?.status === "completed" && loan.status !== "completed";

      // Only add the current user's (borrower's/confirmer's) notification to local state.
      // registrantNotif is saved to Supabase and will appear when the lender loads their data.
      return {
        ...prev,
        payments: updatedPayments,
        loans: updatedLoans,
        notifications: [
          ...completionNotifs,
          confirmerNotif,
          ...prev.notifications,
        ],
      };
    });

    if (paymentSnapshot) {
      // Persist to Supabase
      db.updatePaymentStatus(paymentId, "confirmed");
      db.createNotification({ user_id: paymentSnapshot.created_by_user, type: "payment_confirmed", title: "Payment Confirmed!", description: `Your payment of $${paymentSnapshot.amount.toLocaleString()} was confirmed`, loan_id: paymentSnapshot.loan_id, payment_id: paymentId });
      trackPaymentConfirmed({
        paymentId,
        loanId: paymentSnapshot.loan_id,
        amount: paymentSnapshot.amount,
      });
    }
    if (wasCompleted && loanSnapshot) {
      // Persist loan completion
      db.updateLoanStatus(loanSnapshot.loan_id, "completed");
      db.createNotification({ user_id: loanSnapshot.lender_id, type: "loan_accepted", title: "🎉 Loan Completed!", description: `The loan with ${loanSnapshot.borrower_name} has been fully repaid!`, loan_id: loanSnapshot.loan_id });
      db.createNotification({ user_id: loanSnapshot.borrower_id, type: "loan_accepted", title: "🎉 Loan Completed!", description: `Your loan from ${loanSnapshot.lender_name} is fully repaid!`, loan_id: loanSnapshot.loan_id });
      trackLoanCompleted({
        loanId: loanSnapshot.loan_id,
        totalAmount: loanSnapshot.total_amount,
        numberOfPayments: loanSnapshot.number_of_payments,
      });
    }
  }, []);

  const rejectPayment = useCallback((paymentId: string) => {
    let paymentSnapshot: Payment | undefined;
    setState((prev) => {
      const payment = prev.payments.find((p) => p.payment_id === paymentId);
      if (!payment || payment.status !== "pending_confirmation") return prev;
      paymentSnapshot = payment;

      const updatedPayments = prev.payments.map((p) =>
        p.payment_id === paymentId ? { ...p, status: "rejected" as const } : p
      );

      const rejecterNotif: Notification = {
        id: `notif_${Date.now()}_reject`,
        type: "payment_rejected",
        title: "Payment Rejected",
        message: `You rejected a payment of $${payment.amount.toLocaleString()}`,
        loan_id: payment.loan_id,
        payment_id: paymentId,
        read: false,
        created_at: new Date().toISOString(),
      };

      const registrantNotif: Notification = {
        id: `notif_${Date.now()}_reject_registrant`,
        type: "payment_rejected",
        title: "Payment Rejected",
        message: `Your payment of $${payment.amount.toLocaleString()} was rejected`,
        loan_id: payment.loan_id,
        payment_id: paymentId,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Only add the current user's (borrower's/rejecter's) notification to local state.
      // registrantNotif is saved to Supabase and will appear when the lender loads their data.
      return {
        ...prev,
        payments: updatedPayments,
        notifications: [rejecterNotif, ...prev.notifications],
      };
    });
    if (paymentSnapshot) {
      // Persist to Supabase
      db.updatePaymentStatus(paymentId, "rejected");
      db.createNotification({ user_id: paymentSnapshot.created_by_user, type: "payment_rejected", title: "Payment Rejected", description: `Your payment of $${paymentSnapshot.amount.toLocaleString()} was rejected`, loan_id: paymentSnapshot.loan_id, payment_id: paymentId });
    }
  }, []);

  // ─── Notifications ─────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    db.markNotificationRead(id);
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => {
      if (prev.currentUser?.id) {
        db.markAllNotificationsRead(prev.currentUser.id);
      }
      return {
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      };
    });
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setState((prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
    }));
  }, []);

  // ─── Getters / Computed ────────────────────────────────────────
  const getUnreadCount = useCallback(() => {
    return state.notifications.filter((n) => !n.read).length;
  }, [state.notifications]);

  const getLoanById = useCallback(
    (id: string) => state.loans.find((l) => l.loan_id === id),
    [state.loans]
  );

  const getPaymentsForLoan = useCallback(
    (loanId: string) =>
      state.payments
        .filter((p) => p.loan_id === loanId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [state.payments]
  );

  const getLoanComputed = useCallback(
    (loanId: string): LoanComputedData => {
      const loan = state.loans.find((l) => l.loan_id === loanId);
      const loanPayments = state.payments.filter((p) => p.loan_id === loanId);

      if (!loan) {
        return {
          confirmedPayments: [],
          confirmedAmount: 0,
          remainingBalance: 0,
          progress: 0,
          scheduledPaymentAmount: 0,
          isComplete: false,
        };
      }

      const confirmed = loanPayments.filter((p) => p.status === "confirmed");
      const confirmedAmount = confirmed.reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, loan.total_amount - confirmedAmount);
      const progress = loan.total_amount > 0
        ? Math.min(100, Math.round((confirmedAmount / loan.total_amount) * 100))
        : 100;
      const scheduledPaymentAmount = loan.number_of_payments > 0
        ? Math.round((loan.total_amount / loan.number_of_payments) * 100) / 100
        : loan.total_amount;
      const isComplete =
        loan.status === "completed" ||
        confirmedAmount >= loan.total_amount - 0.01 ||
        confirmed.length >= loan.number_of_payments;

      return {
        confirmedPayments: confirmed,
        confirmedAmount,
        remainingBalance: Math.round(remaining * 100) / 100,
        progress,
        scheduledPaymentAmount,
        isComplete,
      };
    },
    [state.loans, state.payments]
  );

  const getUserById = useCallback(
    (id: string) => state.users.find((u) => u.id === id),
    [state.users]
  );

  const findUserByPhone = useCallback(
    (phone: string) =>
      state.users.find((u) =>
        u.phone_number.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))
      ),
    [state.users]
  );

  const getTotalLent = useCallback(() => {
    if (!state.currentUser) return 0;
    return state.loans
      .filter(
        (l) =>
          l.lender_id === state.currentUser!.id &&
          (l.status === "active" || l.status === "pending")
      )
      .reduce((sum, l) => {
        const paidAmount = state.payments
          .filter((p) => p.loan_id === l.loan_id && p.status === "confirmed")
          .reduce((s, p) => s + p.amount, 0);
        return sum + (l.total_amount - paidAmount);
      }, 0);
  }, [state.loans, state.payments, state.currentUser]);

  const getTotalBorrowed = useCallback(() => {
    if (!state.currentUser) return 0;
    return state.loans
      .filter(
        (l) =>
          l.borrower_id === state.currentUser!.id &&
          (l.status === "active" || l.status === "pending")
      )
      .reduce((sum, l) => {
        const paidAmount = state.payments
          .filter((p) => p.loan_id === l.loan_id && p.status === "confirmed")
          .reduce((s, p) => s + p.amount, 0);
        return sum + (l.total_amount - paidAmount);
      }, 0);
  }, [state.loans, state.payments, state.currentUser]);

  const getPendingLoanRequests = useCallback(() => {
    if (!state.currentUser) return [];
    return state.loans.filter(
      (l) => l.status === "pending" && l.borrower_id === state.currentUser!.id
    );
  }, [state.loans, state.currentUser]);

  const getPendingPaymentConfirmations = useCallback(() => {
    if (!state.currentUser) return [];
    // Return payments where the current user is part of the loan BUT did NOT register the payment
    return state.payments.filter(
      (p) =>
        p.status === "pending_confirmation" &&
        p.created_by_user !== state.currentUser!.id &&
        state.loans.find(
          (l) =>
            l.loan_id === p.loan_id &&
            (l.borrower_id === state.currentUser!.id || l.lender_id === state.currentUser!.id)
        )
    );
  }, [state.payments, state.loans, state.currentUser]);

  const getPendingActions = useCallback(() => {
    if (!state.currentUser) return 0;
    const pendingLoans = state.loans.filter(
      (l) => l.status === "pending" && l.borrower_id === state.currentUser!.id
    ).length;
    const pendingPayments = state.payments.filter(
      (p) =>
        p.status === "pending_confirmation" &&
        p.created_by_user !== state.currentUser!.id &&
        state.loans.find(
          (l) =>
            l.loan_id === p.loan_id &&
            (l.borrower_id === state.currentUser!.id || l.lender_id === state.currentUser!.id)
        )
    ).length;
    return pendingLoans + pendingPayments;
  }, [state.loans, state.payments, state.currentUser]);

  // ─── Security Validation (read-only checks) ────────────────────
  const validateLoanCreation = useCallback(
    (params: {
      borrower: User;
      amount: number;
      interestRate: number;
      numberOfPayments: number;
    }): SecurityValidationResult => {
      if (!state.currentUser) {
        return { allowed: false, reason: "You must be logged in.", warnings: [] };
      }

      return securityService.validateLoanInput({
        userId: state.currentUser.id,
        borrowerId: params.borrower.id,
        amount: params.amount,
        interestRate: params.interestRate,
        numberOfPayments: params.numberOfPayments,
        existingLoans: state.loans,
      });
    },
    [state.currentUser, state.loans]
  );

  const validatePaymentRegistration = useCallback(
    (params: { loanId: string; amount: number }): SecurityValidationResult => {
      if (!state.currentUser) {
        return { allowed: false, reason: "You must be logged in.", warnings: [] };
      }

      const loan = state.loans.find((l) => l.loan_id === params.loanId);
      if (!loan) {
        return { allowed: false, reason: "Loan not found.", warnings: [] };
      }

      const confirmedAmount = state.payments
        .filter((p) => p.loan_id === params.loanId && p.status === "confirmed")
        .reduce((s, p) => s + p.amount, 0);
      const remaining = loan.total_amount - confirmedAmount;

      return securityService.validatePaymentInput({
        userId: state.currentUser.id,
        amount: params.amount,
        remainingBalance: remaining,
        existingPayments: state.payments,
      });
    },
    [state.currentUser, state.loans, state.payments]
  );

  const getSecurityLog = useCallback(() => {
    return securityService.getActivityLog();
  }, []);

  // ─── Realtime Sync Handlers ────────────────────────────────────
  const handleLoanChange = useCallback((loan: Loan, eventType: "INSERT" | "UPDATE") => {
    setState((prev) => {
      const exists = prev.loans.some((l) => l.loan_id === loan.loan_id);
      const loans = exists
        ? prev.loans.map((l) => (l.loan_id === loan.loan_id ? loan : l))
        : [loan, ...prev.loans];
      return { ...prev, loans };
    });
  }, []);

  const handlePaymentChange = useCallback((payment: Payment, eventType: "INSERT" | "UPDATE") => {
    setState((prev) => {
      const exists = prev.payments.some((p) => p.payment_id === payment.payment_id);
      const payments = exists
        ? prev.payments.map((p) => (p.payment_id === payment.payment_id ? payment : p))
        : [...prev.payments, payment];
      return { ...prev, payments };
    });
  }, []);

  const handleNotificationChange = useCallback((notification: Notification, eventType: "INSERT" | "UPDATE") => {
    setState((prev) => {
      if (eventType === "INSERT") {
        // Avoid duplicates — only add if not already in local state
        const exists = prev.notifications.some((n) => n.id === notification.id);
        if (exists) return prev;
        return { ...prev, notifications: [notification, ...prev.notifications] };
      } else {
        // UPDATE — replace
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notification.id ? notification : n
          ),
        };
      }
    });
  }, []);

  // Activate realtime sync when user is authenticated
  useRealtimeSync({
    userId: state.currentUser?.id ?? null,
    onLoanChange: handleLoanChange,
    onPaymentChange: handlePaymentChange,
    onNotificationChange: handleNotificationChange,
  });

  return (
    <AppContext.Provider
      value={{
        ...state,
        navigate,
        login,
        logout,
        acceptTerms,
        selectLoan,
        selectPayment,
        refreshData,
        createLoan,
        acceptLoan,
        declineLoan,
        registerPayment,
        confirmPayment,
        rejectPayment,
        addLoan,
        addPayment,
        updateLoanStatus,
        updatePaymentStatus,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        getUnreadCount,
        getLoanById,
        getPaymentsForLoan,
        getLoanComputed,
        getUserById,
        findUserByPhone,
        getTotalLent,
        getTotalBorrowed,
        getPendingActions,
        getPendingLoanRequests,
        getPendingPaymentConfirmations,
        validateLoanCreation,
        validatePaymentRegistration,
        getSecurityLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}

/** Returns AppContext value or null — useful when the provider may not yet be mounted (e.g. during HMR). */
export function useAppOptional() {
  return useContext(AppContext);
}
