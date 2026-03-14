/**
 * LoanMate — useRealtimeSync Hook
 * Subscribes to Supabase Realtime changes for loans, payments, and notifications.
 * Automatically updates the AppContext state when remote data changes.
 */
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loan, Payment, Notification } from "@/types/loan";
import * as db from "@/services/api/supabaseDataService";

interface RealtimeSyncOptions {
  userId: string | null;
  onLoanChange: (loan: Loan, eventType: "INSERT" | "UPDATE" | "DELETE") => void;
  onPaymentChange: (payment: Payment, eventType: "INSERT" | "UPDATE" | "DELETE") => void;
  onNotificationChange: (notification: Notification, eventType: "INSERT" | "UPDATE") => void;
}

export function useRealtimeSync({
  userId,
  onLoanChange,
  onPaymentChange,
  onNotificationChange,
}: RealtimeSyncOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!userId || isSubscribedRef.current) return;

    // Unsubscribe from any existing channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    isSubscribedRef.current = true;

    const channel = supabase
      .channel(`loanmate-user-${userId}`)
      // Loans: listen for changes where user is lender or borrower
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
          filter: `lender_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") return;
          // Re-fetch the full loan with joined user data
          const loans = await db.getLoansForUser(userId);
          const changedLoan = loans.find((l) => l.loan_id === payload.new?.id);
          if (changedLoan) {
            onLoanChange(changedLoan, payload.eventType as "INSERT" | "UPDATE");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
          filter: `borrower_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") return;
          const loans = await db.getLoansForUser(userId);
          const changedLoan = loans.find((l) => l.loan_id === payload.new?.id);
          if (changedLoan) {
            onLoanChange(changedLoan, payload.eventType as "INSERT" | "UPDATE");
          }
        }
      )
      // Notifications: listen for new notifications for this user
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            type: string;
            title: string;
            description: string | null;
            loan_id: string | null;
            payment_id: string | null;
            is_read: boolean;
            created_at: string;
          };

          const typeMap: Record<string, Notification["type"]> = {
            loan_request_received: "loan_request",
            loan_accepted: "loan_accepted",
            loan_declined: "loan_declined",
            payment_registered: "payment_registered",
            payment_confirmed: "payment_confirmed",
            payment_rejected: "payment_rejected",
            upcoming_payment_reminder: "payment_reminder",
          };

          const notification: Notification = {
            id: row.id,
            type: typeMap[row.type] ?? "loan_request",
            title: row.title,
            message: row.description ?? "",
            loan_id: row.loan_id ?? undefined,
            payment_id: row.payment_id ?? undefined,
            read: row.is_read,
            created_at: row.created_at,
          };

          onNotificationChange(notification, "INSERT");
        }
      )
      // Notifications: listen for read status updates
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            type: string;
            title: string;
            description: string | null;
            loan_id: string | null;
            payment_id: string | null;
            is_read: boolean;
            created_at: string;
          };

          const typeMap: Record<string, Notification["type"]> = {
            loan_request_received: "loan_request",
            loan_accepted: "loan_accepted",
            loan_declined: "loan_declined",
            payment_registered: "payment_registered",
            payment_confirmed: "payment_confirmed",
            payment_rejected: "payment_rejected",
            upcoming_payment_reminder: "payment_reminder",
          };

          const notification: Notification = {
            id: row.id,
            type: typeMap[row.type] ?? "loan_request",
            title: row.title,
            message: row.description ?? "",
            loan_id: row.loan_id ?? undefined,
            payment_id: row.payment_id ?? undefined,
            read: row.is_read,
            created_at: row.created_at,
          };

          onNotificationChange(notification, "UPDATE");
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[LoanMate Realtime] Connected for user:", userId.slice(0, 8) + "...");
        } else if (status === "CHANNEL_ERROR") {
          console.warn("[LoanMate Realtime] Channel error — will retry");
          isSubscribedRef.current = false;
        } else if (status === "CLOSED") {
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Also subscribe to payments for loans the user is part of
    // We do this by watching payments that belong to the user's loans
    // This is done via a separate channel since we can't do joins in realtime filters
    supabase
      .channel(`loanmate-payments-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        async (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as {
            id: string;
            loan_id: string;
            amount: number;
            created_by_user_id: string;
            status: "pending_confirmation" | "confirmed" | "rejected";
            note: string | null;
            created_at: string;
            payment_date: string;
          };

          // Only process if this payment belongs to a loan the user is part of
          const { data: loanData } = await supabase
            .from("loans")
            .select("id, lender_id, borrower_id")
            .eq("id", row.loan_id)
            .single();

          if (
            !loanData ||
            (loanData.lender_id !== userId && loanData.borrower_id !== userId)
          ) {
            return;
          }

          const payment: Payment = {
            payment_id: row.id,
            loan_id: row.loan_id,
            amount: Number(row.amount),
            created_by_user: row.created_by_user_id,
            status: row.status,
            note: row.note ?? undefined,
            created_at: row.created_at,
            payment_date: row.payment_date,
          };

          onPaymentChange(payment, payload.eventType as "INSERT" | "UPDATE");
        }
      )
      .subscribe();
  }, [userId, onLoanChange, onPaymentChange, onNotificationChange]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    isSubscribedRef.current = false;
  }, []);

  useEffect(() => {
    if (userId) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [userId, subscribe, unsubscribe]);
}
