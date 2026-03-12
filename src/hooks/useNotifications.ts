/**
 * LoanMate — useNotifications Hook
 * Manages notification data.
 */
import { useState, useCallback } from "react";
import { notificationService } from "@/services";
import { Notification } from "@/types/loan";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notif: Omit<Notification, "id" | "created_at" | "read">) => Promise<Notification | null>;
  clearError: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications(userId);
      if (res.data) setNotifications(res.data);
      if (res.error) setError(res.error.message);
    } catch {
      setError("Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      setError("Failed to mark notification as read");
    }
  }, []);

  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setError("Failed to mark all notifications as read");
    }
  }, []);

  const addNotification = useCallback(
    async (notif: Omit<Notification, "id" | "created_at" | "read">): Promise<Notification | null> => {
      try {
        const res = await notificationService.createNotification(notif);
        if (res.data) {
          setNotifications((prev) => [res.data!, ...prev]);
          return res.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearError,
  };
}
