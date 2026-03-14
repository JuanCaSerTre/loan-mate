/**
 * LoanMate — User Service
 * User lookup, profile management via Supabase.
 */
import { User } from "@/types/loan";
import { supabase } from "@/lib/supabase";
import type { ApiResponse } from "./client";

class UserService {
  /**
   * Find user by phone number.
   */
  async findByPhone(phone: string): Promise<ApiResponse<User | null>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phone)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return {
            data: null,
            error: { code: "NOT_FOUND", message: "User not found" },
            status: 404,
          };
        }
        throw error;
      }

      return {
        data: {
          id: data.id,
          phone_number: data.phone_number,
          name: data.name,
          avatar: data.avatar_url,
          created_at: data.created_at,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to find user",
        },
        status: 500,
      };
    }
  }

  /**
   * Get user by ID.
   */
  async getUserById(userId: string): Promise<ApiResponse<User | null>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return {
            data: null,
            error: { code: "NOT_FOUND", message: "User not found" },
            status: 404,
          };
        }
        throw error;
      }

      return {
        data: {
          id: data.id,
          phone_number: data.phone_number,
          name: data.name,
          avatar: data.avatar_url,
          created_at: data.created_at,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "QUERY_ERROR",
          message: err.message || "Failed to get user",
        },
        status: 500,
      };
    }
  }

  /**
   * Create or update user profile.
   */
  async upsertProfile(
    userId: string,
    phoneNumber: string,
    name: string,
    avatarUrl?: string
  ): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert({
          id: userId,
          phone_number: phoneNumber,
          name,
          avatar_url: avatarUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.id,
          phone_number: data.phone_number,
          name: data.name,
          avatar: data.avatar_url,
          created_at: data.created_at,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "UPSERT_ERROR",
          message: err.message || "Failed to upsert profile",
        },
        status: 500,
      };
    }
  }

  /**
   * Update user profile.
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, "name" | "avatar">>
  ): Promise<ApiResponse<User>> {
    try {
      const updateData: Record<string, any> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.avatar) updateData.avatar_url = updates.avatar;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return {
        data: {
          id: data.id,
          phone_number: data.phone_number,
          name: data.name,
          avatar: data.avatar_url,
          created_at: data.created_at,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "UPDATE_ERROR",
          message: err.message || "Failed to update profile",
        },
        status: 500,
      };
    }
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
    try {
      // Count loans as lender
      const { count: loansGiven } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("lender_id", userId);

      // Count loans as borrower
      const { count: loansReceived } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("borrower_id", userId);

      // Count completed loans
      const { count: completedLoans } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`);

      return {
        data: {
          loansGiven: loansGiven || 0,
          loansReceived: loansReceived || 0,
          completedLoans: completedLoans || 0,
        },
        error: null,
        status: 200,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          code: "STATS_ERROR",
          message: err.message || "Failed to get user stats",
        },
        status: 500,
      };
    }
  }
}

export const userService = new UserService();
export default UserService;
