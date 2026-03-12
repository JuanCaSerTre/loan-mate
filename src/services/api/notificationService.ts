/**
 * LoanMate — Notification Service
 * Handles in-app notifications and will integrate with push notifications.
 */
import { Notification } from "@/types/loan";
import { mockNotifications } from "@/data/mockData";
import type { ApiResponse } from "./client";

class NotificationService {
  /**
   * Fetch all notifications for a user.
   * TODO: Replace with Supabase query
   */
  async getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    await this._delay(400);

    // Mock: return all notifications (in real app, filter by user_id)
    return { data: mockNotifications, error: null, status: 200 };
  }

  /**
   * Mark a notification as read.
   * TODO: Replace with Supabase update
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    await this._delay(200);

    const notif = mockNotifications.find((n) => n.id === notificationId);
    if (!notif) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Notification not found" },
        status: 404,
      };
    }

    return { data: { ...notif, read: true }, error: null, status: 200 };
  }

  /**
   * Mark all notifications as read.
   * TODO: Replace with Supabase bulk update
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<{ count: number }>> {
    await this._delay(300);

    const unread = mockNotifications.filter((n) => !n.read).length;
    return { data: { count: unread }, error: null, status: 200 };
  }

  /**
   * Get unread notification count.
   */
  async getUnreadCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    await this._delay(200);

    const count = mockNotifications.filter((n) => !n.read).length;
    return { data: { count }, error: null, status: 200 };
  }

  /**
   * Create an in-app notification.
   * TODO: Also trigger push notification via FCM edge function
   */
  async createNotification(
    notification: Omit<Notification, "id" | "created_at" | "read">
  ): Promise<ApiResponse<Notification>> {
    await this._delay(300);

    const newNotif: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
    };

    return { data: newNotif, error: null, status: 201 };
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const notificationService = new NotificationService();
export default NotificationService;
