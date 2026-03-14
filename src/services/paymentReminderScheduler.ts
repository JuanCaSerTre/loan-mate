import { supabase } from "@/lib/supabase";

/**
 * Triggers the send-payment-reminders edge function.
 * This sends payment reminder notifications for loans due tomorrow.
 */
export async function triggerPaymentReminders(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('supabase-functions-send-payment-reminders', {
      method: 'POST',
    });

    if (error) {
      console.error('Error triggering payment reminders:', error);
    }
  } catch (err) {
    console.error('Failed to trigger payment reminders:', err);
  }
}

/**
 * Set up a recurring check for payment reminders.
 * Runs once per day at a fixed time (e.g., 9 AM local time).
 */
export function setupPaymentReminderSchedule(): void {
  // Check if we've already set this up in this session
  const lastCheckKey = 'loanmate_reminder_check_date';
  const lastCheck = localStorage.getItem(lastCheckKey);
  const today = new Date().toDateString();

  if (lastCheck === today) {
    // Already checked today, don't check again
    return;
  }

  // Calculate time until 9 AM
  const now = new Date();
  const nextCheck = new Date();
  nextCheck.setHours(9, 0, 0, 0);

  if (now.getHours() >= 9) {
    // Already past 9 AM, check again tomorrow
    nextCheck.setDate(nextCheck.getDate() + 1);
  }

  const delayMs = nextCheck.getTime() - now.getTime();

  // Schedule the check
  setTimeout(() => {
    triggerPaymentReminders();
    localStorage.setItem(lastCheckKey, today);
  }, delayMs);
}
