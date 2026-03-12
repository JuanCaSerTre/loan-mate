/**
 * LoanMate — Payment Reminder Service
 * Checks for upcoming/due/overdue payments and generates reminder notifications.
 * Supports three reminder types:
 *   1. 1 day before payment due date
 *   2. On the due date itself
 *   3. 2 days after due date if payment is not confirmed
 *
 * Runs on a periodic interval when the app is active.
 */
import { Loan, Payment, Notification } from "@/types/loan";
import { addDays, isAfter, isBefore, isSameDay, startOfDay, format } from "date-fns";

// ─── Reminder Types ────────────────────────────────────────────────
export type ReminderType = "day_before" | "due_today" | "overdue";

export interface ReminderPreferences {
  /** Master toggle — if false, no reminders are generated */
  enabled: boolean;
  /** Remind 1 day before payment is due */
  dayBefore: boolean;
  /** Remind on the due date */
  dueDay: boolean;
  /** Remind 2 days after if payment not confirmed */
  overdue: boolean;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  dayBefore: true,
  dueDay: true,
  overdue: true,
};

// ─── LocalStorage Persistence ──────────────────────────────────────
const REMINDER_STORAGE_KEY = "loanmate_sent_reminders";
const REMINDER_PREFS_KEY = "loanmate_reminder_preferences";

/**
 * Load reminder preferences from localStorage.
 */
export function loadReminderPreferences(): ReminderPreferences {
  try {
    const stored = localStorage.getItem(REMINDER_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_REMINDER_PREFERENCES, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_REMINDER_PREFERENCES };
}

/**
 * Save reminder preferences to localStorage.
 */
export function saveReminderPreferences(prefs: ReminderPreferences): void {
  try {
    localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

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
    // Only keep last 200 reminders
    const arr = Array.from(sent);
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(arr));
  } catch { /* ignore */ }
}

/**
 * Calculate next payment date based on loan schedule and existing confirmed payments.
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
 * Build a unique reminder ID to prevent duplicates.
 */
function buildReminderId(
  loanId: string,
  paymentIndex: number,
  reminderType: ReminderType,
  dateStr: string
): string {
  return `reminder_${loanId}_${paymentIndex}_${reminderType}_${dateStr}`;
}

/**
 * Check all active loans and generate reminders for upcoming/due/overdue payments.
 * Respects user's reminder preferences.
 */
export function checkPaymentReminders(
  loans: Loan[],
  payments: Payment[],
  currentUserId: string,
  preferences?: ReminderPreferences
): Notification[] {
  const prefs = preferences || loadReminderPreferences();

  // Bail if reminders are globally disabled
  if (!prefs.enabled) return [];

  const reminders: Notification[] = [];
  const sentReminders = getSentReminders();
  const today = startOfDay(new Date());
  const twoDaysAgo = addDays(today, -2);
  const todayStr = format(today, "yyyy-MM-dd");

  const activeLoans = loans.filter(
    (l) =>
      l.status === "active" &&
      (l.lender_id === currentUserId || l.borrower_id === currentUserId)
  );

  for (const loan of activeLoans) {
    const confirmedPayments = payments.filter(
      (p) => p.loan_id === loan.loan_id && p.status === "confirmed"
    );
    // Also check for pending payments (registered but not yet confirmed)
    const pendingPayments = payments.filter(
      (p) => p.loan_id === loan.loan_id && p.status === "pending_confirmation"
    );

    const nextPaymentDate = getNextPaymentDate(loan, confirmedPayments.length);
    if (!nextPaymentDate) continue;

    const paymentDueDate = startOfDay(nextPaymentDate);
    const isLender = loan.lender_id === currentUserId;
    const counterpartyName = isLender ? loan.borrower_name : loan.lender_name;
    const scheduledAmount = Math.round((loan.total_amount / loan.number_of_payments) * 100) / 100;
    const dateStr = format(paymentDueDate, "MMM d");
    const paymentIndex = confirmedPayments.length;

    // ─── Reminder 1: 1 Day Before Due ──────────────────────────
    if (prefs.dayBefore && isSameDay(addDays(paymentDueDate, -1), today)) {
      const reminderId = buildReminderId(loan.loan_id, paymentIndex, "day_before", todayStr);
      if (!sentReminders.has(reminderId)) {
        const notification: Notification = {
          id: `notif_${Date.now()}_reminder_daybefore_${loan.loan_id}`,
          type: "payment_reminder",
          title: "💰 Payment Due Tomorrow",
          message: `Payment of $${scheduledAmount.toLocaleString()} ${isLender ? "from" : "to"} ${counterpartyName} is due tomorrow (${dateStr})`,
          loan_id: loan.loan_id,
          read: false,
          created_at: new Date().toISOString(),
        };
        markReminderSent(reminderId);
        reminders.push(notification);
      }
    }

    // ─── Reminder 2: On Due Date ───────────────────────────────
    if (prefs.dueDay && isSameDay(paymentDueDate, today)) {
      const reminderId = buildReminderId(loan.loan_id, paymentIndex, "due_today", todayStr);
      if (!sentReminders.has(reminderId)) {
        const hasPendingPayment = pendingPayments.length > 0;
        const notification: Notification = {
          id: `notif_${Date.now()}_reminder_duetoday_${loan.loan_id}`,
          type: "payment_reminder",
          title: "📅 Payment Due Today",
          message: hasPendingPayment
            ? `A payment of $${scheduledAmount.toLocaleString()} ${isLender ? "from" : "to"} ${counterpartyName} is due today and awaiting confirmation`
            : `A payment of $${scheduledAmount.toLocaleString()} ${isLender ? "from" : "to"} ${counterpartyName} is due today`,
          loan_id: loan.loan_id,
          read: false,
          created_at: new Date().toISOString(),
        };
        markReminderSent(reminderId);
        reminders.push(notification);
      }
    }

    // ─── Reminder 3: 2 Days After Due (Overdue) ────────────────
    if (prefs.overdue) {
      const twoDaysAfterDue = addDays(paymentDueDate, 2);
      if (
        (isSameDay(twoDaysAfterDue, today) || isBefore(twoDaysAfterDue, today)) &&
        isAfter(paymentDueDate, twoDaysAgo) // Only recent overdue, not ancient ones
      ) {
        const overdueDateStr = format(twoDaysAfterDue, "yyyy-MM-dd");
        const reminderId = buildReminderId(loan.loan_id, paymentIndex, "overdue", overdueDateStr);
        if (!sentReminders.has(reminderId)) {
          const notification: Notification = {
            id: `notif_${Date.now()}_reminder_overdue_${loan.loan_id}`,
            type: "payment_reminder",
            title: "⚠️ Payment Overdue",
            message: `A payment of $${scheduledAmount.toLocaleString()} ${isLender ? "from" : "to"} ${counterpartyName} was due on ${dateStr} and has not been confirmed`,
            loan_id: loan.loan_id,
            read: false,
            created_at: new Date().toISOString(),
          };
          markReminderSent(reminderId);
          reminders.push(notification);
        }
      }
    }
  }

  return reminders;
}
