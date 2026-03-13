/**
 * LoanMate — Notification Service
 * Handles in-app notifications via Supabase.
 */
import { Notification } from "@/types/loan";
import { supabase } from "@/lib/supabase";
import type { ApiResponse } from "./client";

class NotificationService {
  /**
   * Fetch all notifications for a user.
   */
  async getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id,
          user_id,
          loan_id,
          payment_id,
          type,
          title,
          description,
          is_read,
          created_at
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const notifications: Notification[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        loan_id: item.loan_id,
        payment_id: item.payment_id,
        type: item.type,
        title: item.title,
        description: item.description,
        read: item.is_read,
        created_at: item.created_at,
      }));

      return { data: notifications, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to fetch notifications",
        },
        status: 500,
      };
    }
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) throw error;

      const notification: Notification = {
        id: data.id,
        user_id: data.user_id,
        loan_id: data.loan_id,
        payment_id: data.payment_id,
        type: data.type,
        title: data.title,
        description: data.description,
        read: data.is_read,
        created_at: data.created_at,
      };

      return { data: notification, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR",
          message: err.message || "Failed to mark notification as read",
        },
        status: 500,
      };
    }
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const { data, error, count } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .select("id", { count: "exact" });

      if (error) throw error;

      return { data: { count: count || 0 }, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR",
          message: err.message || "Failed to mark all notifications as read",
        },
        status: 500,
      };
    }
  }

  /**
   * Get unread notification count.
   */
  async getUnreadCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      return { data: { count: count || 0 }, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to get unread count",
        },
        status: 500,
      };
    }
  }

  /**
   * Create an in-app notification.
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    description?: string,
    loanId?: string,
    paymentId?: string
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          loan_id: loanId || null,
          payment_id: paymentId || null,
          type,
          title,
          description: description || null,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      const notification: Notification = {
        id: data.id,
        user_id: data.user_id,
        loan_id: data.loan_id,
        payment_id: data.payment_id,
        type: data.type,
        title: data.title,
        description: data.description,
        read: data.is_read,
        created_at: data.created_at,
      };

      return { data: notification, error: null, status: 201 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "INSERT_ERROR",
          message: err.message || "Failed to create notification",
        },
        status: 500,
      };
    }
  }
}

export const notificationService = new NotificationService();
export default NotificationService;
