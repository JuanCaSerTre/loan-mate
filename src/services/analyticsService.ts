/**
 * LoanMate — Analytics Service
 *
 * Wraps Firebase Analytics to track key product events and computed metrics.
 * All tracking calls are fire-and-forget: failures are silently logged and
 * never surface to the user.
 *
 * Events tracked:
 *  - user_signup
 *  - loan_created
 *  - loan_accepted
 *  - loan_rejected
 *  - payment_registered
 *  - payment_confirmed
 *  - loan_completed
 *
 * Metrics computable from app state (called on demand):
 *  - daily active users   → tracked via daily_active_user event per session
 *  - number of active loans
 *  - average loan amount
 *  - payment completion rate
 */

import { logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/config/firebase";
import type { Loan, Payment } from "@/types/loan";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function analytics() {
  return getFirebaseAnalytics();
}

function track(eventName: string, params?: Record<string, string | number | boolean>) {
  try {
    const instance = analytics();
    if (!instance) return;
    logEvent(instance, eventName, params);
  } catch (err) {
    console.warn(`[Analytics] Failed to log event "${eventName}":`, err);
  }
}

// ─── Identity ─────────────────────────────────────────────────────────────────

/**
 * Associate the authenticated user with all subsequent analytics events.
 */
export function identifyUser(userId: string, props?: { name?: string }) {
  try {
    const instance = analytics();
    if (!instance) return;
    setUserId(instance, userId);
    if (props?.name) {
      setUserProperties(instance, { display_name: props.name });
    }
  } catch (err) {
    console.warn("[Analytics] identifyUser failed:", err);
  }
}

/**
 * Clear user identity on logout.
 */
export function clearUser() {
  try {
    const instance = analytics();
    if (!instance) return;
    setUserId(instance, null as unknown as string); // Firebase accepts null to clear
  } catch (err) {
    console.warn("[Analytics] clearUser failed:", err);
  }
}

// ─── Daily Active User ────────────────────────────────────────────────────────

const DAU_STORAGE_KEY = "loanmate_dau_last_tracked";

/**
 * Fire once per calendar day per browser session.
 * Stored in localStorage so repeated page loads within the same day don't
 * inflate the count.
 */
export function trackDailyActiveUser(userId: string) {
  try {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const last = localStorage.getItem(DAU_STORAGE_KEY);
    if (last === today) return; // already tracked today
    localStorage.setItem(DAU_STORAGE_KEY, today);
    track("daily_active_user", { user_id: userId });
  } catch (err) {
    console.warn("[Analytics] trackDailyActiveUser failed:", err);
  }
}

// ─── Product Events ───────────────────────────────────────────────────────────

/**
 * Fires when a new user completes the onboarding form and creates their profile.
 */
export function trackUserSignup(userId: string) {
  track("user_signup", { user_id: userId });
}

/**
 * Fires when a lender successfully submits a new loan request.
 */
export function trackLoanCreated(params: {
  loanId: string;
  amount: number;
  interestRate: number;
  numberOfPayments: number;
  paymentFrequency: string;
}) {
  track("loan_created", {
    loan_id: params.loanId,
    amount: params.amount,
    interest_rate: params.interestRate,
    number_of_payments: params.numberOfPayments,
    payment_frequency: params.paymentFrequency,
  });
}

/**
 * Fires when a borrower accepts a pending loan request.
 */
export function trackLoanAccepted(loanId: string, amount: number) {
  track("loan_accepted", { loan_id: loanId, amount });
}

/**
 * Fires when a borrower declines/rejects a pending loan request.
 */
export function trackLoanRejected(loanId: string, amount: number) {
  track("loan_rejected", { loan_id: loanId, amount });
}

/**
 * Fires when a lender registers a payment on an active loan.
 */
export function trackPaymentRegistered(params: {
  paymentId: string;
  loanId: string;
  amount: number;
}) {
  track("payment_registered", {
    payment_id: params.paymentId,
    loan_id: params.loanId,
    amount: params.amount,
  });
}

/**
 * Fires when a borrower confirms a pending payment.
 */
export function trackPaymentConfirmed(params: {
  paymentId: string;
  loanId: string;
  amount: number;
}) {
  track("payment_confirmed", {
    payment_id: params.paymentId,
    loan_id: params.loanId,
    amount: params.amount,
  });
}

/**
 * Fires when a loan reaches completed status (all payments confirmed).
 */
export function trackLoanCompleted(params: {
  loanId: string;
  totalAmount: number;
  numberOfPayments: number;
}) {
  track("loan_completed", {
    loan_id: params.loanId,
    total_amount: params.totalAmount,
    number_of_payments: params.numberOfPayments,
  });
}

// ─── Computed Metrics ─────────────────────────────────────────────────────────

/**
 * Derived metrics — computed from current app state and logged as a single
 * analytics event so they appear in the Firebase dashboard alongside events.
 *
 * Call this periodically (e.g. on dashboard mount) to keep metrics fresh.
 */
export function trackComputedMetrics(loans: Loan[], payments: Payment[]) {
  try {
    // Number of active loans
    const activeLoans = loans.filter((l) => l.status === "active").length;

    // Average loan amount across all non-declined loans
    const measurableLoans = loans.filter((l) => l.status !== "declined");
    const averageLoanAmount =
      measurableLoans.length > 0
        ? Math.round(
            measurableLoans.reduce((s, l) => s + l.loan_amount, 0) /
              measurableLoans.length
          )
        : 0;

    // Payment completion rate = confirmed / (confirmed + pending + rejected)
    const confirmedCount = payments.filter((p) => p.status === "confirmed").length;
    const totalSettledPayments = payments.filter(
      (p) => p.status === "confirmed" || p.status === "rejected"
    ).length;
    const paymentCompletionRate =
      totalSettledPayments > 0
        ? Math.round((confirmedCount / totalSettledPayments) * 100)
        : 0;

    track("computed_metrics", {
      active_loans: activeLoans,
      average_loan_amount: averageLoanAmount,
      payment_completion_rate_pct: paymentCompletionRate,
      total_loans: loans.length,
      total_payments: payments.length,
    });
  } catch (err) {
    console.warn("[Analytics] trackComputedMetrics failed:", err);
  }
}
