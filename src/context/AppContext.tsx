import React, { createContext, useContext, useState, useCallback } from "react";
import { User, Loan, Payment, Notification } from "@/types/loan";
import {
  currentUser as defaultUser,
  mockLoans,
  mockPayments,
  mockNotifications,
  mockUsers,
} from "@/data/mockData";

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

interface AppContextType extends AppState {
  navigate: (screen: AppScreen) => void;
  login: (user: User) => void;
  logout: () => void;
  selectLoan: (loanId: string) => void;
  selectPayment: (paymentId: string) => void;
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
  getUserById: (id: string) => User | undefined;
  findUserByPhone: (phone: string) => User | undefined;
  getTotalLent: () => number;
  getTotalBorrowed: () => number;
  getPendingActions: () => number;
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

  const getUnreadCount = useCallback(() => {
    return state.notifications.filter((n) => !n.read).length;
  }, [state.notifications]);

  const getLoanById = useCallback(
    (id: string) => state.loans.find((l) => l.loan_id === id),
    [state.loans]
  );

  const getPaymentsForLoan = useCallback(
    (loanId: string) => state.payments.filter((p) => p.loan_id === loanId),
    [state.payments]
  );

  const getUserById = useCallback(
    (id: string) => state.users.find((u) => u.id === id),
    [state.users]
  );

  const findUserByPhone = useCallback(
    (phone: string) =>
      state.users.find((u) => u.phone_number.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))),
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
        getUserById,
        findUserByPhone,
        getTotalLent,
        getTotalBorrowed,
        getPendingActions,
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
