/**
 * LoanMate — Payment Reminder Service
 * Checks for upcoming payments and generates reminder notifications.
 * Runs on a periodic interval when the app is active.
 */
import { Loan, Payment, Notification } from "@/types/loan";
import { addDays, isAfter, isBefore, startOfDay, format } from "date-fns";

const REMINDER_STORAGE_KEY = "loanmate_sent_reminders";

/**
 * Get the set of already-sent reminder IDs to avoid duplicates.
 */
function getSentReminders(): Set<string> {
  try {
    const stored = localStorage.getItem(REMINDER_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Mark a reminder as sent.
 */
function markReminderSent(reminderId: string): void {
  try {
    const sent = getSentReminders();
    sent.add(reminderId);
    // Only keep last 100 reminders
    const arr = Array.from(sent);
    if (arr.length > 100) arr.splice(0, arr.length - 100);
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(arr));
  } catch { /* ignore */ }
}

/**
 * Calculate next payment date based on loan schedule and existing payments.
 */
function getNextPaymentDate(loan: Loan, confirmedPaymentCount: number): Date | null {
  const startDate = new Date(loan.start_date);
  const nextPaymentIndex = confirmedPaymentCount;

  if (nextPaymentIndex >= loan.number_of_payments) return null;

  const daysPerPeriod =
    loan.payment_frequency === "weekly" ? 7
    : loan.payment_frequency === "biweekly" ? 14
    : 30; // monthly

  const nextDate = addDays(startDate, daysPerPeriod * (nextPaymentIndex + 1));
  return nextDate;
}

/**
 * Check all active loans and generate reminders for payments due within 1 day.
 */
export function checkPaymentReminders(
  loans: Loan[],
  payments: Payment[],
  currentUserId: string
): Notification[] {
  const reminders: Notification[] = [];
  const sentReminders = getSentReminders();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);

  const activeLoans = loans.filter(
    (l) =>
      l.status === "active" &&
      (l.lender_id === currentUserId || l.borrower_id === currentUserId)
  );

  for (const loan of activeLoans) {
    const confirmedPayments = payments.filter(
      (p) => p.loan_id === loan.loan_id && p.status === "confirmed"
    );

    const nextPaymentDate = getNextPaymentDate(loan, confirmedPayments.length);
    if (!nextPaymentDate) continue;

    // Check if payment is due tomorrow (within a 1-day window)
    const isDueSoon =
      (isAfter(nextPaymentDate, tomorrow) || nextPaymentDate.getTime() === tomorrow.getTime()) &&
      isBefore(nextPaymentDate, dayAfterTomorrow);

    // Also check if payment is overdue (due today or earlier)
    const isOverdue = isBefore(nextPaymentDate, addDays(today, 1));

    if (!isDueSoon && !isOverdue) continue;

    const isLender = loan.lender_id === currentUserId;
    const counterpartyName = isLender ? loan.borrower_name : loan.lender_name;
    const scheduledAmount = Math.round((loan.total_amount / loan.number_of_payments) * 100) / 100;
    const dateStr = format(nextPaymentDate, "MMM d");

    const reminderId = `reminder_${loan.loan_id}_${confirmedPayments.length}_${format(today, "yyyy-MM-dd")}`;

    // Skip if already sent
    if (sentReminders.has(reminderId)) continue;

    const notification: Notification = {
      id: `notif_${Date.now()}_reminder_${loan.loan_id}`,
      type: "payment_reminder",
      title: isOverdue ? "⚠️ Payment Overdue" : "Payment Due Tomorrow",
      message: isOverdue
        ? `A payment of $${scheduledAmount.toLocaleString()} ${isLender ? "from" : "to"} ${counterpartyName} was due on ${dateStr}`
        : `A payment of $${scheduledAmount.toLocaleString()} ${isLender ? "from" : "to"} ${counterpartyName} is due ${dateStr}`,
      loan_id: loan.loan_id,
      read: false,
      created_at: new Date().toISOString(),
    };

    markReminderSent(reminderId);
    reminders.push(notification);
  }

  return reminders;
}
