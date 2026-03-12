/**
 * LoanMate — Zod Validation Schemas
 * Runtime validation for all data models. Used by services and forms.
 */
import { z } from "zod";
import { AUTH, LOAN } from "@/config/constants";

// ─── User ────────────────────────────────────────────────────────
export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  phone_number: z.string().regex(AUTH.PHONE_REGEX, "Invalid phone number (E.164 format)"),
  avatar: z.string().optional(),
  created_at: z.string().datetime(),
});

export const CreateUserSchema = UserSchema.omit({ id: true, created_at: true });

// ─── Loan ────────────────────────────────────────────────────────
export const PaymentFrequencySchema = z.enum(["weekly", "biweekly", "monthly"]);
export const LoanStatusSchema = z.enum(["pending", "active", "completed", "declined"]);

export const LoanSchema = z.object({
  loan_id: z.string().min(1),
  lender_id: z.string().min(1),
  borrower_id: z.string().min(1),
  borrower_phone: z.string(),
  lender_name: z.string(),
  borrower_name: z.string(),
  lender_avatar: z.string().optional(),
  borrower_avatar: z.string().optional(),
  loan_amount: z.number().min(LOAN.MIN_AMOUNT).max(LOAN.MAX_AMOUNT),
  interest_rate: z.number().min(0).max(LOAN.MAX_INTEREST_RATE),
  total_amount: z.number().min(LOAN.MIN_AMOUNT),
  number_of_payments: z.number().int().min(LOAN.MIN_PAYMENTS).max(LOAN.MAX_PAYMENTS),
  payment_frequency: PaymentFrequencySchema,
  start_date: z.string(),
  due_date: z.string(),
  status: LoanStatusSchema,
  created_at: z.string().datetime(),
});

export const CreateLoanSchema = z.object({
  borrower_phone: z.string().min(1, "Borrower phone is required"),
  loan_amount: z.number().min(LOAN.MIN_AMOUNT, `Minimum amount is $${LOAN.MIN_AMOUNT}`).max(LOAN.MAX_AMOUNT),
  interest_rate: z.number().min(0).max(LOAN.MAX_INTEREST_RATE).default(0),
  number_of_payments: z.number().int().min(LOAN.MIN_PAYMENTS).max(LOAN.MAX_PAYMENTS),
  payment_frequency: PaymentFrequencySchema,
  start_date: z.string().min(1, "Start date is required"),
  due_date: z.string().optional(),
});

// ─── Payment ─────────────────────────────────────────────────────
export const PaymentStatusSchema = z.enum(["pending_confirmation", "confirmed", "rejected"]);

export const PaymentSchema = z.object({
  payment_id: z.string().min(1),
  loan_id: z.string().min(1),
  amount: z.number().positive(),
  created_by_user: z.string().min(1),
  status: PaymentStatusSchema,
  note: z.string().optional(),
  created_at: z.string().datetime(),
  payment_date: z.string(),
});

export const CreatePaymentSchema = z.object({
  loan_id: z.string().min(1),
  amount: z.number().positive("Payment amount must be positive"),
  payment_date: z.string().min(1, "Payment date is required"),
  note: z.string().max(500).optional(),
});

// ─── Notification ────────────────────────────────────────────────
export const NotificationTypeSchema = z.enum([
  "loan_request",
  "loan_accepted",
  "loan_declined",
  "payment_registered",
  "payment_confirmed",
  "payment_rejected",
  "payment_reminder",
]);

export const NotificationSchema = z.object({
  id: z.string().min(1),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  loan_id: z.string().optional(),
  payment_id: z.string().optional(),
  read: z.boolean(),
  created_at: z.string().datetime(),
});

// ─── Auth ────────────────────────────────────────────────────────
export const PhoneLoginSchema = z.object({
  phone_number: z.string().regex(AUTH.PHONE_REGEX, "Enter a valid phone number"),
  country_code: z.string().default("+1"),
});

export const OTPVerifySchema = z.object({
  phone_number: z.string(),
  otp: z.string().length(AUTH.OTP_LENGTH, `OTP must be ${AUTH.OTP_LENGTH} digits`),
});

// ─── Inferred Types (use these instead of manual interfaces) ────
export type UserModel = z.infer<typeof UserSchema>;
export type CreateUserModel = z.infer<typeof CreateUserSchema>;
export type LoanModel = z.infer<typeof LoanSchema>;
export type CreateLoanModel = z.infer<typeof CreateLoanSchema>;
export type PaymentModel = z.infer<typeof PaymentSchema>;
export type CreatePaymentModel = z.infer<typeof CreatePaymentSchema>;
export type NotificationModel = z.infer<typeof NotificationSchema>;
export type PhoneLoginModel = z.infer<typeof PhoneLoginSchema>;
export type OTPVerifyModel = z.infer<typeof OTPVerifySchema>;
