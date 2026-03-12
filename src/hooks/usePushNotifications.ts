/**
 * LoanMate — usePushNotifications Hook
 * React hook for managing push notification state and lifecycle.
 * 
 * Usage:
 *   const { isEnabled, permissionStatus, enable, disable, sendPush } = usePushNotifications();
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  pushNotificationService,
  type PushPermissionStatus,
} from "@/services/pushNotificationService";
import { Notification as LoanNotification } from "@/types/loan";

interface UsePushNotificationsReturn {
  /** Whether push notifications are currently enabled */
  isEnabled: boolean;
  /** Current browser permission status */
  permissionStatus: PushPermissionStatus;
  /** Whether we're initializing or requesting permission */
  isLoading: boolean;
  /** FCM token (null if not registered with FCM) */
  fcmToken: string | null;
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Enable push notifications (requests permission if needed) */
  enable: () => Promise<boolean>;
  /** Disable push notifications locally */
  disable: () => void;
  /** Send a push notification for a LoanMate notification event */
  sendPush: (notification: LoanNotification) => Promise<void>;
  /** Show a custom local notification */
  showNotification: (title: string, body: string) => Promise<void>;
}

const STORAGE_KEY = "loanmate_push_enabled";

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const isSupported = pushNotificationService.isSupported();

  // Check initial permission status
  useEffect(() => {
    const status = pushNotificationService.getPermissionStatus();
    setPermissionStatus(status);

    // If permission was previously granted and user enabled notifications, auto-initialize
    if (status === "granted" && isEnabled && !initializedRef.current) {
      initializedRef.current = true;
      pushNotificationService
        .initialize({
          onTokenRefresh: (token) => setFcmToken(token),
        })
        .then(() => {
          setFcmToken(pushNotificationService.getFCMToken());
        });
    }

    return () => {
      // Don't destroy on unmount — keep listening
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enable = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      // Request permission if not already granted
      let status = pushNotificationService.getPermissionStatus();
      if (status !== "granted") {
        status = await pushNotificationService.requestPermission();
        setPermissionStatus(status);
      }

      if (status !== "granted") {
        setIsLoading(false);
        return false;
      }

      // Initialize FCM
      const success = await pushNotificationService.initialize({
        onTokenRefresh: (token) => setFcmToken(token),
      });

      if (success) {
        setIsEnabled(true);
        setFcmToken(pushNotificationService.getFCMToken());
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch { /* ignore */ }
        initializedRef.current = true;
      }

      setIsLoading(false);
      return success;
    } catch (error) {
      console.error("[usePushNotifications] Enable failed:", error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const disable = useCallback(() => {
    setIsEnabled(false);
    try {
      localStorage.setItem(STORAGE_KEY, "false");
    } catch { /* ignore */ }
    // Note: We don't destroy the service worker — just stop sending from our app
  }, []);

  const sendPush = useCallback(
    async (notification: LoanNotification) => {
      if (!isEnabled || permissionStatus !== "granted") return;
      await pushNotificationService.sendForNotification(notification);
    },
    [isEnabled, permissionStatus]
  );

  const showNotification = useCallback(
    async (title: string, body: string) => {
      if (!isEnabled || permissionStatus !== "granted") return;
      await pushNotificationService.showLocalNotification(title, body);
    },
    [isEnabled, permissionStatus]
  );

  return {
    isEnabled,
    permissionStatus,
    isLoading,
    fcmToken,
    isSupported,
    enable,
    disable,
    sendPush,
    showNotification,
  };
}
