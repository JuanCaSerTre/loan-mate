/**
 * LoanMate — Push Notification Provider
 * Wraps the app to intercept notification events and trigger browser push notifications.
 * Also runs the payment reminder scheduler with configurable preferences.
 */
import React, { useEffect, useRef, useCallback, createContext, useContext, useState } from "react";
import { useApp } from "@/context/AppContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  checkPaymentReminders,
  loadReminderPreferences,
  saveReminderPreferences,
  type ReminderPreferences,
  DEFAULT_REMINDER_PREFERENCES,
} from "@/services/paymentReminderService";
import { toast } from "sonner";

interface PushNotificationContextType {
  /** Whether push notifications are enabled */
  isEnabled: boolean;
  /** Browser permission status */
  permissionStatus: string;
  /** Whether push is supported */
  isSupported: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Enable push notifications */
  enablePush: () => Promise<boolean>;
  /** Disable push notifications */
  disablePush: () => void;
  /** Payment reminder preferences */
  reminderPreferences: ReminderPreferences;
  /** Update reminder preferences */
  updateReminderPreferences: (prefs: Partial<ReminderPreferences>) => void;
}

const PushNotificationContext = createContext<PushNotificationContextType>({
  isEnabled: false,
  permissionStatus: "default",
  isSupported: false,
  isLoading: false,
  enablePush: async () => false,
  disablePush: () => {},
  reminderPreferences: DEFAULT_REMINDER_PREFERENCES,
  updateReminderPreferences: () => {},
});

export function usePushContext() {
  return useContext(PushNotificationContext);
}

const REMINDER_CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, loans, payments, currentUser, addNotification } = useApp();
  const { isEnabled, permissionStatus, isSupported, isLoading, enable, disable, sendPush } =
    usePushNotifications();

  // ─── Reminder Preferences State ──────────────────────────────────
  const [reminderPreferences, setReminderPreferences] = useState<ReminderPreferences>(
    loadReminderPreferences
  );

  const updateReminderPreferences = useCallback((updates: Partial<ReminderPreferences>) => {
    setReminderPreferences((prev) => {
      const newPrefs = { ...prev, ...updates };
      saveReminderPreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  // Track previously seen notification count to detect new ones
  const prevNotifCountRef = useRef<number>(notifications.length);
  const prevNotifIdsRef = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));
  const reminderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasPrompted, setHasPrompted] = useState(() => {
    try {
      return localStorage.getItem("loanmate_push_prompted") === "true";
    } catch {
      return false;
    }
  });

  // ─── Detect new notifications and trigger push ───────────────────
  useEffect(() => {
    if (!isEnabled) return;

    // Find new notifications by comparing IDs
    const currentIds = new Set(notifications.map((n) => n.id));
    const newNotifs = notifications.filter(
      (n) => !prevNotifIdsRef.current.has(n.id) && !n.read
    );

    // Send push for each new notification
    for (const notif of newNotifs) {
      sendPush(notif);
    }

    prevNotifCountRef.current = notifications.length;
    prevNotifIdsRef.current = currentIds;
  }, [notifications, isEnabled, sendPush]);

  // ─── Payment Reminder Scheduler ──────────────────────────────────
  const checkReminders = useCallback(() => {
    if (!currentUser) return;

    const reminders = checkPaymentReminders(loans, payments, currentUser.id, reminderPreferences);
    for (const reminder of reminders) {
      addNotification(reminder);
      // Push notification will be triggered by the notification change above
    }
  }, [loans, payments, currentUser, addNotification, reminderPreferences]);

  useEffect(() => {
    if (!currentUser) return;

    // Check immediately on mount
    const timeout = setTimeout(checkReminders, 3000);

    // Then check periodically
    reminderTimerRef.current = setInterval(checkReminders, REMINDER_CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
      }
    };
  }, [currentUser, checkReminders]);

  // ─── Prompt user to enable push notifications ─────────────────────
  useEffect(() => {
    if (!currentUser || hasPrompted || isEnabled || !isSupported) return;
    if (permissionStatus === "denied") return;

    // Show a non-intrusive prompt after a short delay
    const timeout = setTimeout(() => {
      toast("🔔 Enable Push Notifications?", {
        description: "Get notified about loan requests, payments, and reminders",
        action: {
          label: "Enable",
          onClick: async () => {
            const success = await enable();
            if (success) {
              toast.success("Push notifications enabled!");
            } else {
              toast.error("Could not enable notifications. Check browser settings.");
            }
          },
        },
        duration: 8000,
      });

      setHasPrompted(true);
      try {
        localStorage.setItem("loanmate_push_prompted", "true");
      } catch { /* ignore */ }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentUser, hasPrompted, isEnabled, isSupported, permissionStatus, enable]);

  const contextValue: PushNotificationContextType = {
    isEnabled,
    permissionStatus,
    isSupported,
    isLoading,
    enablePush: enable,
    disablePush: disable,
    reminderPreferences,
    updateReminderPreferences,
  };

  return (
    <PushNotificationContext.Provider value={contextValue}>
      {children}
    </PushNotificationContext.Provider>
  );
}
