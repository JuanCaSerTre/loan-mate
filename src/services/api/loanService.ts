/**
 * LoanMate — Loan Service
 * CRUD operations for loans with security validation via Supabase.
 */
import { Loan, LoanStatus } from "@/types/loan";
import { supabase } from "@/lib/supabase";
import type { ApiResponse } from "./client";
import type { CreateLoanModel } from "@/models/schemas";
import { securityService } from "@/services/securityService";

class LoanService {
  /**
   * Fetch all loans for a user (as lender or borrower).
   */
  async getUserLoans(userId: string): Promise<ApiResponse<Loan[]>> {
    try {
      // Validate auth token
      const { valid } = securityService.validateToken();
      if (!valid) {
        securityService.logEvent({
          type: "auth_token_expired",
          userId,
          message: "Unauthenticated loan fetch attempt",
          severity: "warning",
        });
      }

      const { data, error } = await supabase
        .from("loans")
        .select(
          `
          id,
          lender_id,
          borrower_id,
          borrower_phone,
          loan_amount,
          interest_rate,
          total_amount,
          number_of_payments,
          payment_frequency,
          start_date,
          due_date,
          status,
          created_at,
          lender:users!loans_lender_id_fkey(id, name, avatar_url),
          borrower:users!loans_borrower_id_fkey(id, name, avatar_url)
        `
        )
        .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`);

      if (error) throw error;

      const loans: Loan[] = data.map((item: any) => ({
        loan_id: item.id,
        lender_id: item.lender_id,
        borrower_id: item.borrower_id,
        borrower_phone: item.borrower_phone,
        lender_name: item.lender?.name || "Unknown",
        borrower_name: item.borrower?.name || "Unknown",
        lender_avatar: item.lender?.avatar_url || "",
        borrower_avatar: item.borrower?.avatar_url || "",
        loan_amount: item.loan_amount,
        interest_rate: item.interest_rate,
        total_amount: item.total_amount,
        number_of_payments: item.number_of_payments,
        payment_frequency: item.payment_frequency,
        start_date: item.start_date,
        due_date: item.due_date,
        status: item.status,
        created_at: item.created_at,
      }));

      return { data: loans, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to fetch loans",
        },
        status: 500,
      };
    }
  }

  /**
   * Fetch a single loan by ID.
   */
  async getLoanById(loanId: string): Promise<ApiResponse<Loan | null>> {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(
          `
          id,
          lender_id,
          borrower_id,
          borrower_phone,
          loan_amount,
          interest_rate,
          total_amount,
          number_of_payments,
          payment_frequency,
          start_date,
          due_date,
          status,
          created_at,
          lender:users!loans_lender_id_fkey(id, name, avatar_url),
          borrower:users!loans_borrower_id_fkey(id, name, avatar_url)
        `
        )
        .eq("id", loanId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            data: null,
            error: { code: "NOT_FOUND", message: "Loan not found" },
            status: 404,
          };
        }
        throw error;
      }

      const loan: Loan = {
        loan_id: data.id,
        lender_id: data.lender_id,
        borrower_id: data.borrower_id,
        borrower_phone: data.borrower_phone,
        lender_name: data.lender?.name || "Unknown",
        borrower_name: data.borrower?.name || "Unknown",
        lender_avatar: data.lender?.avatar_url || "",
        borrower_avatar: data.borrower?.avatar_url || "",
        loan_amount: data.loan_amount,
        interest_rate: data.interest_rate,
        total_amount: data.total_amount,
        number_of_payments: data.number_of_payments,
        payment_frequency: data.payment_frequency,
        start_date: data.start_date,
        due_date: data.due_date,
        status: data.status,
        created_at: data.created_at,
      };

      return { data: loan, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to fetch loan",
        },
        status: 500,
      };
    }
  }

  /**
   * Create a new loan request.
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
    try {
      // Server-side validation
      if (input.loan_amount <= 0) {
        return {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Loan amount must be positive" },
          status: 400,
        };
      }

      const interestRate = input.interest_rate || 0;
      if (interestRate < 0 || interestRate > 100) {
        return {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Interest rate must be between 0% and 100%" },
          status: 400,
        };
      }

      if (lenderId === borrowerId) {
        return {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Cannot create a loan with yourself" },
          status: 400,
        };
      }

      const totalAmount = input.loan_amount * (1 + interestRate / 100);
      const dueDate = input.due_date || this._calculateDueDate(
        input.start_date,
        input.number_of_payments,
        input.payment_frequency
      );

      const { data, error } = await supabase
        .from("loans")
        .insert({
          lender_id: lenderId,
          borrower_id: borrowerId,
          borrower_phone: input.borrower_phone,
          loan_amount: input.loan_amount,
          interest_rate: interestRate,
          total_amount: Math.round(totalAmount * 100) / 100,
          number_of_payments: input.number_of_payments,
          payment_frequency: input.payment_frequency,
          start_date: input.start_date,
          due_date: dueDate,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      const newLoan: Loan = {
        loan_id: data.id,
        lender_id: data.lender_id,
        borrower_id: data.borrower_id,
        borrower_phone: data.borrower_phone,
        lender_name: lenderName,
        borrower_name: borrowerName,
        lender_avatar: lenderAvatar,
        borrower_avatar: borrowerAvatar,
        loan_amount: data.loan_amount,
        interest_rate: data.interest_rate,
        total_amount: data.total_amount,
        number_of_payments: data.number_of_payments,
        payment_frequency: data.payment_frequency,
        start_date: data.start_date,
        due_date: data.due_date,
        status: data.status,
        created_at: data.created_at,
      };

      return { data: newLoan, error: null, status: 201 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "INSERT_ERROR",
          message: err.message || "Failed to create loan",
        },
        status: 500,
      };
    }
  }

  /**
   * Update loan status (accept, decline, complete).
   */
  async updateLoanStatus(
    loanId: string,
    status: LoanStatus
  ): Promise<ApiResponse<Loan>> {
    try {
      const { data, error } = await supabase
        .from("loans")
        .update({ status })
        .eq("id", loanId)
        .select(
          `
          id,
          lender_id,
          borrower_id,
          borrower_phone,
          loan_amount,
          interest_rate,
          total_amount,
          number_of_payments,
          payment_frequency,
          start_date,
          due_date,
          status,
          created_at,
          lender:users!loans_lender_id_fkey(id, name, avatar_url),
          borrower:users!loans_borrower_id_fkey(id, name, avatar_url)
        `
        )
        .single();

      if (error) throw error;

      const loan: Loan = {
        loan_id: data.id,
        lender_id: data.lender_id,
        borrower_id: data.borrower_id,
        borrower_phone: data.borrower_phone,
        lender_name: data.lender?.name || "Unknown",
        borrower_name: data.borrower?.name || "Unknown",
        lender_avatar: data.lender?.avatar_url || "",
        borrower_avatar: data.borrower?.avatar_url || "",
        loan_amount: data.loan_amount,
        interest_rate: data.interest_rate,
        total_amount: data.total_amount,
        number_of_payments: data.number_of_payments,
        payment_frequency: data.payment_frequency,
        start_date: data.start_date,
        due_date: data.due_date,
        status: data.status,
        created_at: data.created_at,
      };

      return { data: loan, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR",
          message: err.message || "Failed to update loan status",
        },
        status: 500,
      };
    }
  }

  /**
   * Get loans with pending status for a borrower (needs their action).
   */
  async getPendingLoansForBorrower(userId: string): Promise<ApiResponse<Loan[]>> {
    try {
      const { data, error } = await supabase
        .from("loans")
        .select(
          `
          id,
          lender_id,
          borrower_id,
          borrower_phone,
          loan_amount,
          interest_rate,
          total_amount,
          number_of_payments,
          payment_frequency,
          start_date,
          due_date,
          status,
          created_at,
          lender:users!loans_lender_id_fkey(id, name, avatar_url),
          borrower:users!loans_borrower_id_fkey(id, name, avatar_url)
        `
        )
        .eq("borrower_id", userId)
        .eq("status", "pending");

      if (error) throw error;

      const loans: Loan[] = data.map((item: any) => ({
        loan_id: item.id,
        lender_id: item.lender_id,
        borrower_id: item.borrower_id,
        borrower_phone: item.borrower_phone,
        lender_name: item.lender?.name || "Unknown",
        borrower_name: item.borrower?.name || "Unknown",
        lender_avatar: item.lender?.avatar_url || "",
        borrower_avatar: item.borrower?.avatar_url || "",
        loan_amount: item.loan_amount,
        interest_rate: item.interest_rate,
        total_amount: item.total_amount,
        number_of_payments: item.number_of_payments,
        payment_frequency: item.payment_frequency,
        start_date: item.start_date,
        due_date: item.due_date,
        status: item.status,
        created_at: item.created_at,
      }));

      return { data: loans, error: null, status: 200 };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to fetch pending loans",
        },
        status: 500,
      };
    }
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
}

export const loanService = new LoanService();
export default LoanService;
