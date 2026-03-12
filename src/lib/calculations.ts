/**
 * LoanMate — Loan Calculation Utilities
 * Business logic for loan math: interest, due dates, progress, etc.
 */
import { Loan, Payment, PaymentFrequency } from "@/types/loan";

/**
 * Calculate total amount with simple interest.
 */
export function calculateTotalAmount(principal: number, interestRate: number): number {
  return Math.round(principal * (1 + interestRate / 100) * 100) / 100;
}

/**
 * Calculate individual payment amount.
 */
export function calculatePaymentAmount(totalAmount: number, numberOfPayments: number): number {
  return Math.round((totalAmount / numberOfPayments) * 100) / 100;
}

/**
 * Calculate remaining balance on a loan.
 */
export function calculateRemainingBalance(loan: Loan, confirmedPayments: Payment[]): number {
  const totalPaid = confirmedPayments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, Math.round((loan.total_amount - totalPaid) * 100) / 100);
}

/**
 * Calculate loan progress as a percentage (0–100).
 */
export function calculateLoanProgress(loan: Loan, confirmedPayments: Payment[]): number {
  const totalPaid = confirmedPayments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0);
  if (loan.total_amount === 0) return 100;
  return Math.min(100, Math.round((totalPaid / loan.total_amount) * 100));
}

/**
 * Calculate due date based on start date, frequency, and number of payments.
 */
export function calculateDueDate(
  startDate: string,
  numberOfPayments: number,
  frequency: PaymentFrequency
): string {
  const start = new Date(startDate);
  const daysPerPeriod = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  const dueDate = new Date(start.getTime() + numberOfPayments * daysPerPeriod * 24 * 60 * 60 * 1000);
  return dueDate.toISOString().split("T")[0];
}

/**
 * Calculate next payment due date.
 */
export function calculateNextPaymentDate(
  startDate: string,
  paymentsMade: number,
  frequency: PaymentFrequency
): string {
  const start = new Date(startDate);
  const daysPerPeriod = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  const nextDate = new Date(start.getTime() + (paymentsMade + 1) * daysPerPeriod * 24 * 60 * 60 * 1000);
  return nextDate.toISOString().split("T")[0];
}

/**
 * Check if a loan is overdue (any payment past due and not confirmed).
 */
export function isLoanOverdue(loan: Loan): boolean {
  if (loan.status !== "active") return false;
  const dueDate = new Date(loan.due_date);
  return dueDate < new Date();
}

/**
 * Get number of days until next payment or loan due date.
 */
export function daysUntilDue(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Aggregate total lent by a user across active/pending loans.
 */
export function calculateTotalLent(
  userId: string,
  loans: Loan[],
  payments: Payment[]
): number {
  return loans
    .filter(
      (l) => l.lender_id === userId && (l.status === "active" || l.status === "pending")
    )
    .reduce((sum, l) => {
      const paid = payments
        .filter((p) => p.loan_id === l.loan_id && p.status === "confirmed")
        .reduce((s, p) => s + p.amount, 0);
      return sum + (l.total_amount - paid);
    }, 0);
}

/**
 * Aggregate total borrowed by a user across active/pending loans.
 */
export function calculateTotalBorrowed(
  userId: string,
  loans: Loan[],
  payments: Payment[]
): number {
  return loans
    .filter(
      (l) => l.borrower_id === userId && (l.status === "active" || l.status === "pending")
    )
    .reduce((sum, l) => {
      const paid = payments
        .filter((p) => p.loan_id === l.loan_id && p.status === "confirmed")
        .reduce((s, p) => s + p.amount, 0);
      return sum + (l.total_amount - paid);
    }, 0);
}
