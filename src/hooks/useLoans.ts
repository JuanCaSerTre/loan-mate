/**
 * LoanMate — useLoans Hook
 * Manages loan data fetching and mutations.
 */
import { useState, useCallback } from "react";
import { loanService } from "@/services";
import { Loan, LoanStatus } from "@/types/loan";
import type { CreateLoanModel } from "@/models/schemas";

interface UseLoansReturn {
  loans: Loan[];
  isLoading: boolean;
  error: string | null;
  fetchLoans: (userId: string) => Promise<void>;
  createLoan: (
    lenderId: string,
    lenderName: string,
    lenderAvatar: string,
    borrowerName: string,
    borrowerAvatar: string,
    borrowerId: string,
    input: CreateLoanModel
  ) => Promise<Loan | null>;
  updateStatus: (loanId: string, status: LoanStatus) => Promise<boolean>;
  getLoanById: (loanId: string) => Loan | undefined;
  clearError: () => void;
}

export function useLoans(): UseLoansReturn {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loanService.getUserLoans(userId);
      if (res.data) setLoans(res.data);
      if (res.error) setError(res.error.message);
    } catch {
      setError("Failed to fetch loans");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLoan = useCallback(
    async (
      lenderId: string,
      lenderName: string,
      lenderAvatar: string,
      borrowerName: string,
      borrowerAvatar: string,
      borrowerId: string,
      input: CreateLoanModel
    ): Promise<Loan | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await loanService.createLoan(
          lenderId,
          lenderName,
          lenderAvatar,
          borrowerName,
          borrowerAvatar,
          borrowerId,
          input
        );
        if (res.data) {
          setLoans((prev) => [...prev, res.data!]);
          return res.data;
        }
        if (res.error) setError(res.error.message);
        return null;
      } catch {
        setError("Failed to create loan");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateStatus = useCallback(
    async (loanId: string, status: LoanStatus): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await loanService.updateLoanStatus(loanId, status);
        if (res.data) {
          setLoans((prev) =>
            prev.map((l) => (l.loan_id === loanId ? { ...l, status } : l))
          );
          return true;
        }
        if (res.error) setError(res.error.message);
        return false;
      } catch {
        setError("Failed to update loan status");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getLoanById = useCallback(
    (loanId: string) => loans.find((l) => l.loan_id === loanId),
    [loans]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    loans,
    isLoading,
    error,
    fetchLoans,
    createLoan,
    updateStatus,
    getLoanById,
    clearError,
  };
}
