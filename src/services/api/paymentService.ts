/**
 * LoanMate — Payment Service
 * CRUD operations for payments.
 * Currently uses mock data; swap to Supabase queries when connected.
 */
import { Payment, PaymentStatus } from "@/types/loan";
import { mockPayments } from "@/data/mockData";
import type { ApiResponse } from "./client";
import type { CreatePaymentModel } from "@/models/schemas";

class PaymentService {
  /**
   * Fetch all payments for a loan.
   * TODO: Replace with Supabase query
   */
  async getPaymentsForLoan(loanId: string): Promise<ApiResponse<Payment[]>> {
    await this._delay(400);

    const payments = mockPayments.filter((p) => p.loan_id === loanId);
    return { data: payments, error: null, status: 200 };
  }

  /**
   * Register a new payment.
   * TODO: Replace with Supabase insert
   */
  async createPayment(
    userId: string,
    input: CreatePaymentModel
  ): Promise<ApiResponse<Payment>> {
    await this._delay(600);

    const newPayment: Payment = {
      payment_id: `pay_${Date.now()}`,
      loan_id: input.loan_id,
      amount: input.amount,
      created_by_user: userId,
      status: "pending_confirmation",
      note: input.note,
      created_at: new Date().toISOString(),
      payment_date: input.payment_date,
    };

    return { data: newPayment, error: null, status: 201 };
  }

  /**
   * Update payment status (confirm or reject).
   * TODO: Replace with Supabase update
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<ApiResponse<Payment>> {
    await this._delay(400);

    const payment = mockPayments.find((p) => p.payment_id === paymentId);
    if (!payment) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Payment not found" },
        status: 404,
      };
    }

    const updated = { ...payment, status };
    return { data: updated, error: null, status: 200 };
  }

  /**
   * Get pending payments that need confirmation from a specific user.
   */
  async getPendingConfirmations(
    userId: string,
    loans: { loan_id: string; borrower_id: string }[]
  ): Promise<ApiResponse<Payment[]>> {
    await this._delay(300);

    const userLoanIds = loans
      .filter((l) => l.borrower_id === userId)
      .map((l) => l.loan_id);

    const pending = mockPayments.filter(
      (p) => p.status === "pending_confirmation" && userLoanIds.includes(p.loan_id)
    );

    return { data: pending, error: null, status: 200 };
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const paymentService = new PaymentService();
export default PaymentService;
