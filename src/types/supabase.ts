export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone_number: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone_number: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          lender_id: string;
          borrower_id: string | null;
          borrower_phone: string;
          loan_amount: number;
          interest_rate: number;
          total_amount: number;
          number_of_payments: number;
          payment_frequency: "weekly" | "biweekly" | "monthly";
          start_date: string;
          due_date: string;
          status: "pending" | "active" | "completed" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lender_id: string;
          borrower_id?: string | null;
          borrower_phone: string;
          loan_amount: number;
          interest_rate?: number;
          total_amount: number;
          number_of_payments: number;
          payment_frequency: "weekly" | "biweekly" | "monthly";
          start_date: string;
          due_date: string;
          status?: "pending" | "active" | "completed" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lender_id?: string;
          borrower_id?: string | null;
          borrower_phone?: string;
          loan_amount?: number;
          interest_rate?: number;
          total_amount?: number;
          number_of_payments?: number;
          payment_frequency?: "weekly" | "biweekly" | "monthly";
          start_date?: string;
          due_date?: string;
          status?: "pending" | "active" | "completed" | "declined";
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          loan_id: string;
          amount: number;
          created_by_user_id: string;
          status: "pending_confirmation" | "confirmed" | "rejected";
          payment_date: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          amount: number;
          created_by_user_id: string;
          status?: "pending_confirmation" | "confirmed" | "rejected";
          payment_date: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          amount?: number;
          created_by_user_id?: string;
          status?: "pending_confirmation" | "confirmed" | "rejected";
          payment_date?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          loan_id: string | null;
          payment_id: string | null;
          type:
            | "loan_request_received"
            | "loan_accepted"
            | "loan_declined"
            | "payment_registered"
            | "payment_confirmed"
            | "payment_rejected"
            | "upcoming_payment_reminder";
          title: string;
          description: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          loan_id?: string | null;
          payment_id?: string | null;
          type:
            | "loan_request_received"
            | "loan_accepted"
            | "loan_declined"
            | "payment_registered"
            | "payment_confirmed"
            | "payment_rejected"
            | "upcoming_payment_reminder";
          title: string;
          description?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          loan_id?: string | null;
          payment_id?: string | null;
          type?:
            | "loan_request_received"
            | "loan_accepted"
            | "loan_declined"
            | "payment_registered"
            | "payment_confirmed"
            | "payment_rejected"
            | "upcoming_payment_reminder";
          title?: string;
          description?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type LoanRow = Database["public"]["Tables"]["loans"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
