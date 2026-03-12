/**
 * LoanMate — usePayments Hook
 * Manages payment data fetching and mutations.
 */
import { useState, useCallback } from "react";
import { paymentService } from "@/services";
import { Payment, PaymentStatus } from "@/types/loan";
import type { CreatePaymentModel } from "@/models/schemas";

interface UsePaymentsReturn {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  fetchPayments: (loanId: string) => Promise<void>;
  createPayment: (userId: string, input: CreatePaymentModel) => Promise<Payment | null>;
  updateStatus: (paymentId: string, status: PaymentStatus) => Promise<boolean>;
  clearError: () => void;
}

export function usePayments(): UsePaymentsReturn {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (loanId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await paymentService.getPaymentsForLoan(loanId);
      if (res.data) setPayments(res.data);
      if (res.error) setError(res.error.message);
    } catch {
      setError("Failed to fetch payments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = useCallback(
    async (userId: string, input: CreatePaymentModel): Promise<Payment | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await paymentService.createPayment(userId, input);
        if (res.data) {
          setPayments((prev) => [...prev, res.data!]);
          return res.data;
        }
        if (res.error) setError(res.error.message);
        return null;
      } catch {
        setError("Failed to register payment");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateStatus = useCallback(
    async (paymentId: string, status: PaymentStatus): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await paymentService.updatePaymentStatus(paymentId, status);
        if (res.data) {
          setPayments((prev) =>
            prev.map((p) => (p.payment_id === paymentId ? { ...p, status } : p))
          );
          return true;
        }
        if (res.error) setError(res.error.message);
        return false;
      } catch {
        setError("Failed to update payment status");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    payments,
    isLoading,
    error,
    fetchPayments,
    createPayment,
    updateStatus,
    clearError,
  };
}
