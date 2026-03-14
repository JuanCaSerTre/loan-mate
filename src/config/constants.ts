/**
 * LoanMate — Application Constants
 * Central configuration for the entire app.
 */

// ─── Design Tokens ───────────────────────────────────────────────
export const COLORS = {
  background: "#0D1B2A",
  surface: "#1A2B3C",
  surfaceGlass: "rgba(255,255,255,0.05)",
  primary: "#00C9A7", // teal-cyan — CTAs, progress, active badges
  warning: "#FFB347", // warm amber — pending states
  danger: "#FF6B6B", // coral red — errors, rejections
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  border: "rgba(0,201,167,0.15)",
} as const;

export const FONTS = {
  display: "'Syne', sans-serif", // headings, amounts (800 weight)
  body: "'Manrope', sans-serif", // UI text (400/600)
  mono: "'JetBrains Mono', monospace", // loan amounts, OTP
} as const;

// ─── Auth ────────────────────────────────────────────────────────
export const AUTH = {
  OTP_LENGTH: 6,
  OTP_RESEND_INTERVAL_SECONDS: 60,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/, // E.164 format
} as const;

// ─── Loan ────────────────────────────────────────────────────────
export const LOAN = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 1_000_000,
  MAX_INTEREST_RATE: 100,
  MIN_PAYMENTS: 1,
  MAX_PAYMENTS: 120,
  PAYMENT_FREQUENCIES: ["weekly", "biweekly", "monthly"] as const,
} as const;

// ─── Navigation ──────────────────────────────────────────────────
export const NAV_SCREENS = ["dashboard", "loans", "contacts", "notifications", "profile"] as const;

export type AppScreen =
  | "splash"
  | "login"
  | "onboarding"
  | "dashboard"
  | "loans"
  | "create-loan"
  | "loan-details"
  | "loan-request"
  | "register-payment"
  | "notifications"
  | "contacts"
  | "profile";

// ─── Notification Types ──────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  LOAN_REQUEST: "loan_request",
  LOAN_ACCEPTED: "loan_accepted",
  LOAN_DECLINED: "loan_declined",
  PAYMENT_REGISTERED: "payment_registered",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PAYMENT_REJECTED: "payment_rejected",
  PAYMENT_REMINDER: "payment_reminder",
} as const;

// ─── Push Notification Events ────────────────────────────────────
export const PUSH_NOTIFICATION_EVENTS = [
  { type: "loan_request", label: "New loan request", emoji: "💸" },
  { type: "loan_accepted", label: "Loan accepted", emoji: "✅" },
  { type: "loan_declined", label: "Loan declined", emoji: "❌" },
  { type: "payment_registered", label: "Payment registered", emoji: "💳" },
  { type: "payment_confirmed", label: "Payment confirmed", emoji: "✅" },
  { type: "payment_rejected", label: "Payment rejected", emoji: "❌" },
  { type: "payment_reminder", label: "Upcoming payment reminder", emoji: "⏰" },
] as const;

// ─── Payment Reminder ────────────────────────────────────────────
export const REMINDER = {
  DAYS_BEFORE_DUE: 1,
  CHECK_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
} as const;

// ─── Security ─────────────────────────────────────────────────────
export const SECURITY = {
  /** Max loans a user can create per day */
  MAX_LOANS_PER_DAY: 10,
  /** Max payments a user can register per day */
  MAX_PAYMENTS_PER_DAY: 20,
  /** Minimum minutes between duplicate loan requests (same lender + borrower + amount) */
  DUPLICATE_LOAN_COOLDOWN_MINUTES: 30,
  /** Max failed OTP attempts before lockout */
  MAX_OTP_ATTEMPTS: 5,
  /** OTP lockout duration in minutes */
  OTP_LOCKOUT_MINUTES: 15,
  /** Session token expiry in milliseconds (1 hour) */
  SESSION_TOKEN_EXPIRY_MS: 60 * 60 * 1000,
  /** Token refresh buffer — refresh if less than this many ms remain */
  TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000,
  /** Max interest rate considered reasonable (%) */
  MAX_REASONABLE_INTEREST_RATE: 50,
  /** Min loan amount that triggers a high-value warning */
  SUSPICIOUS_HIGH_AMOUNT: 50_000,
  /** Max number of active loans between the same two users */
  MAX_ACTIVE_LOANS_BETWEEN_USERS: 5,
} as const;

// ─── API ─────────────────────────────────────────────────────────
export const API = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 15000,
} as const;

// ─── Splash ──────────────────────────────────────────────────────
export const SPLASH = {
  AUTO_TRANSITION_MS: 2000,
} as const;

// ─── Subscription / Premium ──────────────────────────────────────
export const SUBSCRIPTION = {
  /** Max active loans for free users */
  FREE_LOAN_LIMIT: 3,
  /** Monthly price in USD */
  MONTHLY_PRICE: 3.99,
  /** Yearly price in USD */
  YEARLY_PRICE: 29.99,
  /** Savings percentage for yearly vs monthly */
  YEARLY_SAVINGS_PERCENT: Math.round(
    ((3.99 * 12 - 29.99) / (3.99 * 12)) * 100
  ),
  FEATURES: {
    FREE: [
      "Up to 3 active loans",
      "Basic payment tracking",
      "Push notifications",
    ],
    PREMIUM: [
      "Unlimited active loans",
      "Advanced payment reminders",
      "Loan export reports",
      "Priority support",
      "Custom payment schedules",
    ],
  },
} as const;
