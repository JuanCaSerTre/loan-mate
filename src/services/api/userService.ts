/**
 * LoanMate — User Service
 * User lookup, profile management.
 */
import { User } from "@/types/loan";
import { mockUsers } from "@/data/mockData";
import type { ApiResponse } from "./client";

class UserService {
  /**
   * Find user by phone number.
   * TODO: Replace with Supabase query
   */
  async findByPhone(phone: string): Promise<ApiResponse<User | null>> {
    await this._delay(500);

    const cleanPhone = phone.replace(/\D/g, "");
    const user = mockUsers.find((u) =>
      u.phone_number.replace(/\D/g, "").includes(cleanPhone)
    ) || null;

    if (!user) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "User not found" },
        status: 404,
      };
    }

    return { data: user, error: null, status: 200 };
  }

  /**
   * Get user by ID.
   */
  async getUserById(userId: string): Promise<ApiResponse<User | null>> {
    await this._delay(300);

    const user = mockUsers.find((u) => u.id === userId) || null;
    if (!user) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "User not found" },
        status: 404,
      };
    }

    return { data: user, error: null, status: 200 };
  }

  /**
   * Update user profile.
   * TODO: Replace with Supabase update
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, "name" | "avatar">>
  ): Promise<ApiResponse<User>> {
    await this._delay(400);

    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "User not found" },
        status: 404,
      };
    }

    const updated = { ...user, ...updates };
    return { data: updated, error: null, status: 200 };
  }

  /**
   * Get user statistics.
   */
  async getUserStats(userId: string): Promise<
    ApiResponse<{
      loansGiven: number;
      loansReceived: number;
      completedLoans: number;
    }>
  > {
    await this._delay(300);

    // Mock stats - in real app, aggregate from loans table
    return {
      data: {
        loansGiven: 3,
        loansReceived: 2,
        completedLoans: 1,
      },
      error: null,
      status: 200,
    };
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const userService = new UserService();
export default UserService;
