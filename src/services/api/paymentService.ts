/**
 * LoanMate — Payment Service
 * CRUD operations for payments via Supabase.
 */
import { Payment, PaymentStatus } from "@/types/loan";
import { supabase } from "@/lib/supabase";
import type { ApiResponse } from "./client";
import type { CreatePaymentModel } from "@/models/schemas";

class PaymentService {
  /**
   * Fetch all payments for a loan.
   */
  async getPaymentsForLoan(loanId: string): Promise<ApiResponse<Payment[]>> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          id,
          loan_id,
          amount,
          created_by_user_id,
          status,
          payment_date,
          note,
          created_at
        `
        )
        .eq("loan_id", loanId)
        .order("payment_date", { ascending: true });

      if (error) throw error;

      const payments: Payment[] = data.map((item: any) => ({
        payment_id: item.id,
        loan_id: item.loan_id,
        amount: item.amount,
        created_by_user: item.created_by_user_id,
        status: item.status,
        note: item.note,
        payment_date: item.payment_date,
        created_at: item.created_at,
      }));

      return { data: payments, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to fetch payments",
        },
        status: 500,
      };
    }
  }

  /**
   * Register a new payment.
   */
  async createPayment(
    userId: string,
    input: CreatePaymentModel
  ): Promise<ApiResponse<Payment>> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          loan_id: input.loan_id,
          amount: input.amount,
          created_by_user_id: userId,
          status: "pending_confirmation",
          payment_date: input.payment_date,
          note: input.note || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newPayment: Payment = {
        payment_id: data.id,
        loan_id: data.loan_id,
        amount: data.amount,
        created_by_user: data.created_by_user_id,
        status: data.status,
        payment_date: data.payment_date,
        note: data.note,
        created_at: data.created_at,
      };

      return { data: newPayment, error: null, status: 201 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "INSERT_ERROR",
          message: err.message || "Failed to create payment",
        },
        status: 500,
      };
    }
  }

  /**
   * Update payment status (confirm or reject).
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<ApiResponse<Payment>> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) throw error;

      const payment: Payment = {
        payment_id: data.id,
        loan_id: data.loan_id,
        amount: data.amount,
        created_by_user: data.created_by_user_id,
        status: data.status,
        payment_date: data.payment_date,
        note: data.note,
        created_at: data.created_at,
      };

      return { data: payment, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR",
          message: err.message || "Failed to update payment status",
        },
        status: 500,
      };
    }
  }

  /**
   * Get pending payments that need confirmation from a specific user.
   */
  async getPendingConfirmations(
    userId: string,
    loans: { loan_id: string; borrower_id: string }[]
  ): Promise<ApiResponse<Payment[]>> {
    try {
      const userLoanIds = loans
        .filter((l) => l.borrower_id === userId)
        .map((l) => l.loan_id);

      if (userLoanIds.length === 0) {
        return { data: [], error: null, status: 200 };
      }

      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          id,
          loan_id,
          amount,
          created_by_user_id,
          status,
          payment_date,
          note,
          created_at
        `
        )
        .eq("status", "pending_confirmation")
        .in("loan_id", userLoanIds);

      if (error) throw error;

      const payments: Payment[] = data.map((item: any) => ({
        payment_id: item.id,
        loan_id: item.loan_id,
        amount: item.amount,
        created_by_user: item.created_by_user_id,
        status: item.status,
        note: item.note,
        payment_date: item.payment_date,
        created_at: item.created_at,
      }));

      return { data: payments, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to fetch pending confirmations",
        },
        status: 500,
      };
    }
  }
}

export const paymentService = new PaymentService();
export default PaymentService;
