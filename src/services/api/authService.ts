/**
 * LoanMate — Auth Service
 * Handles phone verification, OTP, session management.
 * Currently uses mock implementation; swap to Supabase Auth when connected.
 */
import { User } from "@/types/loan";
import { currentUser, mockUsers } from "@/data/mockData";
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
   * Send OTP code to a phone number.
   * TODO: Replace with Supabase Auth signInWithOtp()
   */
  async sendOTP(phoneNumber: string): Promise<ApiResponse<OTPResult>> {
    // Simulate network delay
    await this._delay(800);

    // Mock: always succeeds
    return {
      data: { success: true, message: "OTP sent successfully" },
      error: null,
      status: 200,
    };
  }

  /**
   * Verify OTP code.
   * TODO: Replace with Supabase Auth verifyOtp()
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<ApiResponse<AuthSession>> {
    await this._delay(1000);

    // Mock: accept any 6-digit code
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return {
        data: null,
        error: { code: "INVALID_OTP", message: "Invalid verification code" },
        status: 400,
      };
    }

    // Find user by phone or return null (new user flow)
    const existingUser = mockUsers.find(
      (u) => u.phone_number.replace(/\D/g, "").includes(phoneNumber.replace(/\D/g, ""))
    );

    const user = existingUser || null;
    const session: AuthSession = {
      user: user || currentUser,
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000,
    };

    this.session = session;

    return {
      data: session,
      error: null,
      status: 200,
    };
  }

  /**
   * Create user profile after first-time phone verification.
   * TODO: Replace with Supabase insert into users table
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
   * TODO: Replace with Supabase Auth signOut()
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
