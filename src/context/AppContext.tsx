import React, { createContext, useContext, useState, useCallback } from "react";
import { User, Loan, Payment, Notification } from "@/types/loan";
import {
  mockLoans,
  mockPayments,
  mockNotifications,
  mockUsers,
} from "@/data/mockData";
import {
  calculateTotalAmount,
} from "@/lib/calculations";

type AppScreen =
  | "splash"
  | "login"
  | "onboarding"
  | "dashboard"
  | "loans"
  | "create-loan"
  | "loan-details"
  | "loan-request"
  | "register-payment"
  | "notifications"
  | "profile";

interface AppState {
  currentScreen: AppScreen;
  currentUser: User | null;
  isAuthenticated: boolean;
  loans: Loan[];
  payments: Payment[];
  notifications: Notification[];
  users: User[];
  selectedLoanId: string | null;
  selectedPaymentId: string | null;
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
  login: (user: User) => void;
  logout: () => void;
  selectLoan: (loanId: string) => void;
  selectPayment: (paymentId: string) => void;
  createLoan: (params: {
    borrower: User;
    amount: number;
    interestRate: number;
    numberOfPayments: number;
    paymentFrequency: Loan["payment_frequency"];
    startDate: string;
    dueDate: string;
  }) => string;
  acceptLoan: (loanId: string) => void;
  declineLoan: (loanId: string) => void;
  registerPayment: (params: {
    loanId: string;
    amount: number;
    paymentDate: string;
    note?: string;
  }) => void;
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentScreen: "splash",
    currentUser: null,
    isAuthenticated: false,
    loans: mockLoans,
    payments: mockPayments,
    notifications: mockNotifications,
    users: mockUsers,
    selectedLoanId: null,
    selectedPaymentId: null,
  });

  const navigate = useCallback((screen: AppScreen) => {
    setState((prev) => ({ ...prev, currentScreen: screen }));
  }, []);

  const login = useCallback((user: User) => {
    setState((prev) => ({
      ...prev,
      currentUser: user,
      isAuthenticated: true,
      currentScreen: "dashboard",
    }));
  }, []);

  const logout = useCallback(() => {
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

  // ─── Loan Creation Flow ────────────────────────────────────────
  const createLoan = useCallback(
    (params: {
      borrower: User;
      amount: number;
      interestRate: number;
      numberOfPayments: number;
      paymentFrequency: Loan["payment_frequency"];
      startDate: string;
      dueDate: string;
    }) => {
      const loanId = `loan_${Date.now()}`;
      const totalAmount = calculateTotalAmount(params.amount, params.interestRate);

      setState((prev) => {
        if (!prev.currentUser) return prev;

        const newLoan: Loan = {
          loan_id: loanId,
          lender_id: prev.currentUser.id,
          borrower_id: params.borrower.id,
          borrower_phone: params.borrower.phone_number,
          lender_name: prev.currentUser.name,
          borrower_name: params.borrower.name,
          lender_avatar: prev.currentUser.avatar,
          borrower_avatar: params.borrower.avatar,
          loan_amount: params.amount,
          interest_rate: params.interestRate,
          total_amount: totalAmount,
          number_of_payments: params.numberOfPayments,
          payment_frequency: params.paymentFrequency,
          start_date: params.startDate,
          due_date: params.dueDate,
          status: "pending",
          created_at: new Date().toISOString(),
        };

        // Notification for lender (confirmation)
        const lenderNotif: Notification = {
          id: `notif_${Date.now()}_lender`,
          type: "loan_request",
          title: "Loan Request Sent",
          message: `You sent a loan request to ${params.borrower.name} for $${params.amount.toLocaleString()}`,
          loan_id: loanId,
          read: false,
          created_at: new Date().toISOString(),
        };

        // Notification for borrower (they receive the request)
        const borrowerNotif: Notification = {
          id: `notif_${Date.now()}_borrower`,
          type: "loan_request",
          title: "New Loan Request",
          message: `${prev.currentUser.name} wants to lend you $${params.amount.toLocaleString()}`,
          loan_id: loanId,
          read: false,
          created_at: new Date().toISOString(),
        };

        return {
          ...prev,
          loans: [...prev.loans, newLoan],
          notifications: [borrowerNotif, lenderNotif, ...prev.notifications],
          selectedLoanId: loanId,
        };
      });

      return loanId;
    },
    []
  );

  // ─── Loan Accept/Decline ───────────────────────────────────────
  const acceptLoan = useCallback((loanId: string) => {
    setState((prev) => {
      const loan = prev.loans.find((l) => l.loan_id === loanId);
      if (!loan || loan.status !== "pending") return prev;

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

      return {
        ...prev,
        loans: updatedLoans,
        notifications: [lenderNotif, borrowerNotif, ...prev.notifications],
      };
    });
  }, []);

  const declineLoan = useCallback((loanId: string) => {
    setState((prev) => {
      const loan = prev.loans.find((l) => l.loan_id === loanId);
      if (!loan || loan.status !== "pending") return prev;

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

      return {
        ...prev,
        loans: updatedLoans,
        notifications: [lenderNotif, borrowerNotif, ...prev.notifications],
      };
    });
  }, []);

  // ─── Payment Registration ──────────────────────────────────────
  const registerPayment = useCallback(
    (params: {
      loanId: string;
      amount: number;
      paymentDate: string;
      note?: string;
    }) => {
      setState((prev) => {
        if (!prev.currentUser) return prev;
        const loan = prev.loans.find((l) => l.loan_id === params.loanId);
        if (!loan || loan.status !== "active") return prev;

        // Calculate remaining to cap overpayment
        const confirmedAmount = prev.payments
          .filter((p) => p.loan_id === params.loanId && p.status === "confirmed")
          .reduce((s, p) => s + p.amount, 0);
        const remaining = loan.total_amount - confirmedAmount;
        const clampedAmount = Math.min(params.amount, remaining);

        const newPayment: Payment = {
          payment_id: `pay_${Date.now()}`,
          loan_id: params.loanId,
          amount: clampedAmount,
          created_by_user: prev.currentUser.id,
          status: "pending_confirmation",
          note: params.note || undefined,
          created_at: new Date().toISOString(),
          payment_date: params.paymentDate,
        };

        const isLender = loan.lender_id === prev.currentUser.id;
        const counterpartyName = isLender ? loan.borrower_name : loan.lender_name;

        const senderNotif: Notification = {
          id: `notif_${Date.now()}_pay_sender`,
          type: "payment_registered",
          title: "Payment Registered",
          message: `You registered a payment of $${clampedAmount.toLocaleString()} for ${counterpartyName} to confirm`,
          loan_id: params.loanId,
          payment_id: newPayment.payment_id,
          read: false,
          created_at: new Date().toISOString(),
        };

        const receiverNotif: Notification = {
          id: `notif_${Date.now()}_pay_receiver`,
          type: "payment_registered",
          title: "Payment Awaiting Confirmation",
          message: `${prev.currentUser.name} registered a payment of $${clampedAmount.toLocaleString()} — please confirm`,
          loan_id: params.loanId,
          payment_id: newPayment.payment_id,
          read: false,
          created_at: new Date().toISOString(),
        };

        return {
          ...prev,
          payments: [...prev.payments, newPayment],
          notifications: [receiverNotif, senderNotif, ...prev.notifications],
        };
      });
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
    setState((prev) => {
      const payment = prev.payments.find((p) => p.payment_id === paymentId);
      if (!payment || payment.status !== "pending_confirmation") return prev;

      const loan = prev.loans.find((l) => l.loan_id === payment.loan_id);
      if (!loan) return prev;

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

      return {
        ...prev,
        payments: updatedPayments,
        loans: updatedLoans,
        notifications: [
          ...completionNotifs,
          registrantNotif,
          confirmerNotif,
          ...prev.notifications,
        ],
      };
    });
  }, []);

  const rejectPayment = useCallback((paymentId: string) => {
    setState((prev) => {
      const payment = prev.payments.find((p) => p.payment_id === paymentId);
      if (!payment || payment.status !== "pending_confirmation") return prev;

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

      return {
        ...prev,
        payments: updatedPayments,
        notifications: [registrantNotif, rejecterNotif, ...prev.notifications],
      };
    });
  }, []);

  // ─── Notifications ─────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
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
    return state.payments.filter(
      (p) =>
        p.status === "pending_confirmation" &&
        state.loans.find(
          (l) =>
            l.loan_id === p.loan_id &&
            l.borrower_id === state.currentUser!.id
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
        state.loans.find(
          (l) =>
            l.loan_id === p.loan_id &&
            l.borrower_id === state.currentUser!.id
        )
    ).length;
    return pendingLoans + pendingPayments;
  }, [state.loans, state.payments, state.currentUser]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        navigate,
        login,
        logout,
        selectLoan,
        selectPayment,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
