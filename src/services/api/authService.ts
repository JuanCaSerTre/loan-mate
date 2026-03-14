/**
 * LoanMate — Auth Service
 * Handles phone verification via Twilio Verify (through Supabase Edge Functions).
 */
import { User } from "@/types/loan";
import { supabase } from "@/lib/supabase";
import { getUserByPhone } from "@/services/api/supabaseDataService";
import type { ApiResponse } from "./client";

// ─── Types ───────────────────────────────────────────────────────
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OTPResult {
  success: boolean;
  message: string;
}

// ─── Auth Service ────────────────────────────────────────────────
class AuthService {
  private session: AuthSession | null = null;

  /**
   * Send OTP via Twilio Verify through Supabase Edge Function.
   * phoneNumber must be in E.164 format, e.g. +15551234567
   */
  async sendOTP(phoneNumber: string): Promise<ApiResponse<OTPResult>> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-send-otp",
        { body: { phoneNumber } }
      );

      // Network-level error (function unreachable, CORS, etc.)
      if (error) {
        console.error("[sendOTP] invoke error:", error);
        return {
          data: null,
          error: { code: "SEND_OTP_ERROR", message: error.message || "Failed to reach server" },
          status: 500,
        };
      }

      // Application-level error (Twilio failure, missing config, etc.)
      if (!data?.success) {
        console.error("[sendOTP] server error:", data?.error);
        return {
          data: null,
          error: { code: "SEND_OTP_ERROR", message: data?.error || "Failed to send OTP" },
          status: 400,
        };
      }

      return {
        data: { success: true, message: "OTP sent successfully" },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      console.error("[sendOTP] exception:", err);
      return {
        data: null,
        error: { code: "SEND_OTP_ERROR", message: err.message || "Network error" },
        status: 500,
      };
    }
  }

  /**
   * Verify OTP via Twilio Verify through Supabase Edge Function.
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<ApiResponse<AuthSession>> {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return {
        data: null,
        error: { code: "INVALID_OTP", message: "Invalid verification code" },
        status: 400,
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-verify-otp",
        { body: { phoneNumber, code: otp } }
      );

      // Network-level error
      if (error) {
        console.error("[verifyOTP] invoke error:", error);
        return {
          data: null,
          error: { code: "VERIFY_OTP_ERROR", message: error.message || "Failed to reach server" },
          status: 500,
        };
      }

      // Application-level error or invalid code
      if (!data?.valid) {
        console.error("[verifyOTP] verification failed:", data?.error || data?.status);
        return {
          data: null,
          error: { code: "INVALID_OTP", message: data?.error || "Incorrect or expired verification code" },
          status: 400,
        };
      }

      // Look up the user in Supabase by phone number
      const existingUser = await getUserByPhone(phoneNumber);

      const session: AuthSession = {
        user: existingUser ?? ({
          id: "",
          name: "",
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
        } as User),
        accessToken: `access_${Date.now()}`,
        refreshToken: `refresh_${Date.now()}`,
        expiresAt: Date.now() + 3600 * 1000,
      };

      this.session = session;

      return {
        data: session,
        error: null,
        status: 200,
      };
    } catch (err: any) {
      console.error("[verifyOTP] exception:", err);
      return {
        data: null,
        error: { code: "VERIFY_OTP_ERROR", message: err.message || "Network error" },
        status: 500,
      };
    }
  }

  /**
   * Create user profile after first-time phone verification.
   */
  async createProfile(name: string, phoneNumber: string, avatar?: string): Promise<ApiResponse<User>> {
    await this._delay(600);

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      phone_number: phoneNumber,
      avatar: avatar || name.split(" ").map((n) => n[0]).join("").toUpperCase(),
      created_at: new Date().toISOString(),
    };

    return {
      data: newUser,
      error: null,
      status: 201,
    };
  }

  /**
   * Get current session.
   */
  getSession(): AuthSession | null {
    return this.session;
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.session && this.session.expiresAt > Date.now();
  }

  /**
   * Log out.
   */
  async logout(): Promise<void> {
    this.session = null;
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const authService = new AuthService();
export default AuthService;
