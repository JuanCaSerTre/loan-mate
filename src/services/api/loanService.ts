/**
 * LoanMate — Loan Service
 * CRUD operations for loans with security validation.
 * Currently uses mock data; swap to Supabase queries when connected.
 */
import { Loan, LoanStatus } from "@/types/loan";
import { mockLoans } from "@/data/mockData";
import type { ApiResponse } from "./client";
import type { CreateLoanModel } from "@/models/schemas";
import { securityService } from "@/services/securityService";

class LoanService {
  /**
   * Fetch all loans for a user (as lender or borrower).
   * TODO: Replace with Supabase query
   */
  async getUserLoans(userId: string): Promise<ApiResponse<Loan[]>> {
    await this._delay(500);

    // Validate auth token
    const { valid } = securityService.validateToken();
    if (!valid) {
      securityService.logEvent({
        type: "auth_token_expired",
        userId,
        message: "Unauthenticated loan fetch attempt",
        severity: "warning",
      });
      // Still return data for MVP mock, but log the attempt
    }

    const loans = mockLoans.filter(
      (l) => l.lender_id === userId || l.borrower_id === userId
    );

    return { data: loans, error: null, status: 200 };
  }

  /**
   * Fetch a single loan by ID.
   */
  async getLoanById(loanId: string): Promise<ApiResponse<Loan | null>> {
    await this._delay(300);

    const loan = mockLoans.find((l) => l.loan_id === loanId) || null;
    if (!loan) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Loan not found" },
        status: 404,
      };
    }

    return { data: loan, error: null, status: 200 };
  }

  /**
   * Create a new loan request.
   * Includes server-side-like validation for amount and interest rate.
   * TODO: Replace with Supabase insert
   */
  async createLoan(
    lenderId: string,
    lenderName: string,
    lenderAvatar: string,
    borrowerName: string,
    borrowerAvatar: string,
    borrowerId: string,
    input: CreateLoanModel
  ): Promise<ApiResponse<Loan>> {
    await this._delay(800);

    // Server-side validation: amount must be positive
    if (input.loan_amount <= 0) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Loan amount must be positive" },
        status: 400,
      };
    }

    // Server-side validation: interest rate bounds
    const interestRate = input.interest_rate || 0;
    if (interestRate < 0 || interestRate > 100) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Interest rate must be between 0% and 100%" },
        status: 400,
      };
    }

    // Server-side validation: prevent self-loan
    if (lenderId === borrowerId) {
      return {
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Cannot create a loan with yourself" },
        status: 400,
      };
    }

    const totalAmount = input.loan_amount * (1 + interestRate / 100);

    const newLoan: Loan = {
      loan_id: `loan_${Date.now()}`,
      lender_id: lenderId,
      borrower_id: borrowerId,
      borrower_phone: input.borrower_phone,
      lender_name: lenderName,
      borrower_name: borrowerName,
      lender_avatar: lenderAvatar,
      borrower_avatar: borrowerAvatar,
      loan_amount: input.loan_amount,
      interest_rate: interestRate,
      total_amount: Math.round(totalAmount * 100) / 100,
      number_of_payments: input.number_of_payments,
      payment_frequency: input.payment_frequency,
      start_date: input.start_date,
      due_date: input.due_date || this._calculateDueDate(input.start_date, input.number_of_payments, input.payment_frequency),
      status: "pending",
      created_at: new Date().toISOString(),
    };

    return { data: newLoan, error: null, status: 201 };
  }

  /**
   * Update loan status (accept, decline, complete).
   * TODO: Replace with Supabase update
   */
  async updateLoanStatus(
    loanId: string,
    status: LoanStatus
  ): Promise<ApiResponse<Loan>> {
    await this._delay(400);

    const loan = mockLoans.find((l) => l.loan_id === loanId);
    if (!loan) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Loan not found" },
        status: 404,
      };
    }

    const updated = { ...loan, status };
    return { data: updated, error: null, status: 200 };
  }

  /**
   * Get loans with pending status for a borrower (needs their action).
   */
  async getPendingLoansForBorrower(userId: string): Promise<ApiResponse<Loan[]>> {
    await this._delay(300);

    const pending = mockLoans.filter(
      (l) => l.borrower_id === userId && l.status === "pending"
    );

    return { data: pending, error: null, status: 200 };
  }

  // ─── Helpers ─────────────────────────────────────────────────
  private _calculateDueDate(
    startDate: string,
    payments: number,
    frequency: string
  ): string {
    const start = new Date(startDate);
    const multiplier = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
    const dueDate = new Date(start.getTime() + payments * multiplier * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split("T")[0];
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const loanService = new LoanService();
export default LoanService;
