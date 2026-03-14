/**
 * LoanMate — Push Notification Service
 * Manages browser push notifications via Firebase Cloud Messaging.
 */
import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging, isFirebaseConfigured, VAPID_KEY } from "@/config/firebase";
import { Notification as LoanNotification } from "@/types/loan";

// ─── Types ────────────────────────────────────────────────────────
export type PushPermissionStatus = "granted" | "denied" | "default" | "unsupported";

export interface PushNotificationConfig {
  onNotificationReceived?: (payload: MessagePayload) => void;
  onTokenRefresh?: (token: string) => void;
}

// ─── Notification Event Mappings ──────────────────────────────────
const NOTIFICATION_ICONS: Record<string, string> = {
  loan_request: "💸",
  loan_accepted: "✅",
  loan_declined: "❌",
  payment_registered: "💳",
  payment_confirmed: "✅",
  payment_rejected: "❌",
  payment_reminder: "⏰",
};

const NOTIFICATION_TAGS: Record<string, string> = {
  loan_request: "loan-request",
  loan_accepted: "loan-update",
  loan_declined: "loan-update",
  payment_registered: "payment",
  payment_confirmed: "payment",
  payment_rejected: "payment",
  payment_reminder: "reminder",
};

// ─── Push Notification Service ────────────────────────────────────
class PushNotificationService {
  private _fcmToken: string | null = null;
  private _unsubscribeOnMessage: (() => void) | null = null;
  private _isInitialized = false;
  private _permissionStatus: PushPermissionStatus = "default";
  private _swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Check if push notifications are supported in this browser
   */
  isSupported(): boolean {
    return (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): PushPermissionStatus {
    if (!this.isSupported()) return "unsupported";
    this._permissionStatus = Notification.permission as PushPermissionStatus;
    return this._permissionStatus;
  }

  /**
   * Get current FCM token (null if not registered)
   */
  getFCMToken(): string | null {
    return this._fcmToken;
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<PushPermissionStatus> {
    if (!this.isSupported()) {
      console.warn("[LoanMate Push] Notifications not supported in this browser");
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      this._permissionStatus = permission as PushPermissionStatus;
      console.log("[LoanMate Push] Permission:", permission);
      return this._permissionStatus;
    } catch (error) {
      console.error("[LoanMate Push] Permission request failed:", error);
      return "denied";
    }
  }

  /**
   * Initialize FCM and register for push notifications
   */
  async initialize(config?: PushNotificationConfig): Promise<boolean> {
    if (this._isInitialized) return true;

    if (!this.isSupported()) {
      console.warn("[LoanMate Push] Push notifications not supported");
      return false;
    }

    if (Notification.permission !== "granted") {
      console.warn("[LoanMate Push] Permission not granted");
      return false;
    }

    if (!isFirebaseConfigured()) {
      console.warn("[LoanMate Push] Firebase not configured — using local notifications only");
      this._isInitialized = true;
      return true;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.warn("[LoanMate Push] FCM not available — using local notifications only");
      this._isInitialized = true;
      return true;
    }

    try {
      // Register service worker
      const registration = await this._registerServiceWorker();
      this._swRegistration = registration;

      // Send Firebase config to service worker so it can handle background messages
      if (registration) {
        this._sendConfigToSW(registration);
      }

      // Get FCM token
      if (VAPID_KEY && registration) {
        try {
          this._fcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          console.log("[LoanMate Push] FCM Token registered:", this._fcmToken?.slice(0, 20) + "...");
          config?.onTokenRefresh?.(this._fcmToken ?? "");
        } catch (tokenError) {
          console.warn("[LoanMate Push] FCM token error (continuing with local notifications):", tokenError);
        }
      }

      // Listen for foreground messages
      this._unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log("[LoanMate Push] Foreground message:", payload);
        config?.onNotificationReceived?.(payload);

        if (payload.notification) {
          this.showLocalNotification(
            payload.notification.title || "JUCA",
            payload.notification.body || "",
            { data: payload.data as Record<string, string | undefined> }
          );
        }
      });

      this._isInitialized = true;
      return true;
    } catch (error) {
      console.error("[LoanMate Push] Initialization failed:", error);
      this._isInitialized = true;
      return true;
    }
  }

  /**
   * Show a local browser notification (works without FCM)
   */
  async showLocalNotification(
    title: string,
    body: string,
    options?: {
      icon?: string;
      tag?: string;
      data?: Record<string, string | undefined>;
      requireInteraction?: boolean;
    }
  ): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return false;
    }

    try {
      const registration = this._swRegistration || await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: options?.icon || "/vite.svg",
          badge: "/vite.svg",
          tag: options?.tag || "juca-notification",
          data: options?.data,
          requireInteraction: options?.requireInteraction || false,
          vibrate: [200, 100, 200],
        });
      } else {
        new Notification(title, {
          body,
          icon: options?.icon || "/vite.svg",
          tag: options?.tag || "juca-notification",
        });
      }
      return true;
    } catch (error) {
      console.error("[LoanMate Push] Failed to show notification:", error);
      return false;
    }
  }

  /**
   * Send a push notification for an in-app notification event.
   */
  async sendForNotification(notification: LoanNotification): Promise<void> {
    const emoji = NOTIFICATION_ICONS[notification.type] || "🔔";
    const tag = NOTIFICATION_TAGS[notification.type] || "general";

    await this.showLocalNotification(
      `${emoji} ${notification.title}`,
      notification.message,
      {
        tag: `juca-${tag}-${notification.id}`,
        data: {
          notificationId: notification.id,
          type: notification.type,
          loanId: notification.loan_id,
          paymentId: notification.payment_id,
        },
        requireInteraction: notification.type === "loan_request" || notification.type === "payment_registered",
      }
    );
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this._unsubscribeOnMessage) {
      this._unsubscribeOnMessage();
      this._unsubscribeOnMessage = null;
    }
    this._isInitialized = false;
    this._fcmToken = null;
  }

  /**
   * Register service worker for notifications
   */
  private async _registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });
      console.log("[LoanMate Push] Service worker registered");
      return registration;
    } catch (error) {
      console.warn("[LoanMate Push] Service worker registration failed:", error);
      return null;
    }
  }

  /**
   * Send Firebase config to service worker for background message handling
   */
  private _sendConfigToSW(registration: ServiceWorkerRegistration): void {
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      };

      if (!config.apiKey || !config.projectId) return;

      const sw = registration.active || registration.installing || registration.waiting;
      if (sw) {
        sw.postMessage({ type: "FIREBASE_CONFIG", config });
      } else {
        // Wait for SW to activate
        registration.addEventListener("updatefound", () => {
          const newSW = registration.installing;
          if (newSW) {
            newSW.addEventListener("statechange", () => {
              if (newSW.state === "activated") {
                newSW.postMessage({ type: "FIREBASE_CONFIG", config });
              }
            });
          }
        });
      }
    } catch (err) {
      console.warn("[LoanMate Push] Could not send config to SW:", err);
    }
  }
}

// Singleton export
export const pushNotificationService = new PushNotificationService();
export default PushNotificationService;
