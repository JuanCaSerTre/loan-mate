/**
 * LoanMate — useAuth Hook
 * Encapsulates authentication state and actions.
 * Bridges the auth service with React state.
 */
import { useState, useCallback } from "react";
import { authService } from "@/services";
import type { AuthSession } from "@/services";
import { User } from "@/types/loan";

interface UseAuthReturn {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, otp: string) => Promise<{ isNewUser: boolean; user: User | null }>;
  createProfile: (name: string, phone: string, avatar?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOTP = useCallback(async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.sendOTP(phone);
      if (res.error) {
        setError(res.error.message);
        return false;
      }
      return true;
    } catch {
      setError("Failed to send OTP");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(
    async (phone: string, otp: string): Promise<{ isNewUser: boolean; user: User | null }> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authService.verifyOTP(phone, otp);
        if (res.error) {
          setError(res.error.message);
          return { isNewUser: false, user: null };
        }
        setSession(res.data);
        // If user has no name set, treat as new user
        const isNewUser = !res.data?.user?.name;
        return { isNewUser, user: res.data?.user || null };
      } catch {
        setError("Verification failed");
        return { isNewUser: false, user: null };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createProfile = useCallback(
    async (name: string, phone: string, avatar?: string): Promise<User | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authService.createProfile(name, phone, avatar);
        if (res.error) {
          setError(res.error.message);
          return null;
        }
        return res.data;
      } catch {
        setError("Profile creation failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    session,
    isLoading,
    error,
    sendOTP,
    verifyOTP,
    createProfile,
    logout,
    clearError,
  };
}
