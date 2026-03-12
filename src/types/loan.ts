export type PaymentFrequency = "weekly" | "biweekly" | "monthly";
export type LoanStatus = "pending" | "active" | "completed" | "declined";
export type PaymentStatus = "pending_confirmation" | "confirmed" | "rejected";

export interface User {
  id: string;
  name: string;
  phone_number: string;
  avatar?: string;
  created_at: string;
}

export interface Loan {
  loan_id: string;
  lender_id: string;
  borrower_id: string;
  borrower_phone: string;
  lender_name: string;
  borrower_name: string;
  lender_avatar?: string;
  borrower_avatar?: string;
  loan_amount: number;
  interest_rate: number;
  total_amount: number;
  number_of_payments: number;
  payment_frequency: PaymentFrequency;
  start_date: string;
  due_date: string;
  status: LoanStatus;
  created_at: string;
}

export interface Payment {
  payment_id: string;
  loan_id: string;
  amount: number;
  created_by_user: string;
  status: PaymentStatus;
  note?: string;
  created_at: string;
  payment_date: string;
}

export interface Notification {
  id: string;
  type: "loan_request" | "loan_accepted" | "loan_declined" | "payment_registered" | "payment_confirmed" | "payment_rejected" | "payment_reminder";
  title: string;
  message: string;
  loan_id?: string;
  payment_id?: string;
  read: boolean;
  created_at: string;
}
