/**
 * LoanMate — Validation Utilities
 * Common validation helpers for forms and inputs.
 */
import { AUTH, LOAN } from "@/config/constants";

/**
 * Validate phone number (E.164 format).
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Validate E.164 strict format.
 */
export function isE164(phone: string): boolean {
  return AUTH.PHONE_REGEX.test(phone);
}

/**
 * Validate OTP format.
 */
export function isValidOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp) && otp.length === AUTH.OTP_LENGTH;
}

/**
 * Validate loan amount.
 */
export function isValidLoanAmount(amount: number): boolean {
  return amount >= LOAN.MIN_AMOUNT && amount <= LOAN.MAX_AMOUNT;
}

/**
 * Validate interest rate.
 */
export function isValidInterestRate(rate: number): boolean {
  return rate >= 0 && rate <= LOAN.MAX_INTEREST_RATE;
}

/**
 * Validate number of payments.
 */
export function isValidPaymentCount(count: number): boolean {
  return Number.isInteger(count) && count >= LOAN.MIN_PAYMENTS && count <= LOAN.MAX_PAYMENTS;
}

/**
 * Validate date is not in the past.
 */
export function isNotPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Sanitize phone input — strip non-numeric characters.
 */
export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

/**
 * Sanitize numeric input — strip non-numeric and non-decimal characters.
 */
export function sanitizeNumeric(input: string): string {
  return input.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}
