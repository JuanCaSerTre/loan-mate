/**
 * LoanMate — Security Service
 * Rate limiting, duplicate detection, activity logging, and token auth.
 * All client-side for MVP; swap to server-side enforcement when backend connected.
 */
import { SECURITY } from "@/config/constants";
import { Loan, Payment } from "@/types/loan";

// ─── Types ───────────────────────────────────────────────────────
export type SecurityEventType =
  | "rate_limit_exceeded"
  | "duplicate_loan_blocked"
  | "invalid_input"
  | "suspicious_amount"
  | "high_interest_rate"
  | "max_active_loans_exceeded"
  | "auth_token_expired"
  | "auth_token_refreshed"
  | "otp_failed_attempt"
  | "otp_lockout"
  | "loan_created"
  | "payment_registered"
  | "login_success"
  | "terms_accepted"
  | "logout";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

export interface SecurityValidationResult {
  allowed: boolean;
  reason?: string;
  warnings: string[];
}

export interface AuthToken {
  token: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

// ─── Storage Keys ────────────────────────────────────────────────
const STORAGE_KEYS = {
  ACTIVITY_LOG: "juca_security_log",
  AUTH_TOKEN: "juca_auth_token",
  OTP_ATTEMPTS: "juca_otp_attempts",
  RATE_LIMITS: "juca_rate_limits",
} as const;

// ─── Security Service ────────────────────────────────────────────
class SecurityService {
  private activityLog: SecurityEvent[] = [];
  private authToken: AuthToken | null = null;

  constructor() {
    this._loadFromStorage();
  }

  // ═══════════════════════════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check if user can create a loan (daily rate limit).
   */
  checkLoanCreationRateLimit(userId: string, existingLoans: Loan[]): SecurityValidationResult {
    const warnings: string[] = [];
    const today = new Date().toISOString().split("T")[0];

    const loansCreatedToday = existingLoans.filter(
      (l) =>
        l.lender_id === userId &&
        l.created_at.startsWith(today)
    ).length;

    if (loansCreatedToday >= SECURITY.MAX_LOANS_PER_DAY) {
      this.logEvent({
        type: "rate_limit_exceeded",
        userId,
        message: `User attempted to create loan #${loansCreatedToday + 1} today (limit: ${SECURITY.MAX_LOANS_PER_DAY})`,
        severity: "warning",
        metadata: { loansToday: loansCreatedToday, limit: SECURITY.MAX_LOANS_PER_DAY },
      });

      return {
        allowed: false,
        reason: `You've reached the daily limit of ${SECURITY.MAX_LOANS_PER_DAY} loans. Try again tomorrow.`,
        warnings,
      };
    }

    if (loansCreatedToday >= SECURITY.MAX_LOANS_PER_DAY - 2) {
      warnings.push(
        `You've created ${loansCreatedToday} of ${SECURITY.MAX_LOANS_PER_DAY} allowed loans today.`
      );
    }

    return { allowed: true, warnings };
  }

  /**
   * Check if user can register a payment (daily rate limit).
   */
  checkPaymentRateLimit(userId: string, existingPayments: Payment[]): SecurityValidationResult {
    const warnings: string[] = [];
    const today = new Date().toISOString().split("T")[0];

    const paymentsToday = existingPayments.filter(
      (p) =>
        p.created_by_user === userId &&
        p.created_at.startsWith(today)
    ).length;

    if (paymentsToday >= SECURITY.MAX_PAYMENTS_PER_DAY) {
      this.logEvent({
        type: "rate_limit_exceeded",
        userId,
        message: `User attempted to register payment #${paymentsToday + 1} today (limit: ${SECURITY.MAX_PAYMENTS_PER_DAY})`,
        severity: "warning",
        metadata: { paymentsToday, limit: SECURITY.MAX_PAYMENTS_PER_DAY },
      });

      return {
        allowed: false,
        reason: `You've reached the daily limit of ${SECURITY.MAX_PAYMENTS_PER_DAY} payments. Try again tomorrow.`,
        warnings,
      };
    }

    return { allowed: true, warnings };
  }

  // ═══════════════════════════════════════════════════════════════
  // DUPLICATE DETECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Detect duplicate loans between the same users within the cooldown period.
   */
  checkDuplicateLoan(
    lenderId: string,
    borrowerId: string,
    amount: number,
    existingLoans: Loan[]
  ): SecurityValidationResult {
    const warnings: string[] = [];
    const cooldownMs = SECURITY.DUPLICATE_LOAN_COOLDOWN_MINUTES * 60 * 1000;
    const now = Date.now();

    const recentDuplicate = existingLoans.find(
      (l) =>
        l.lender_id === lenderId &&
        l.borrower_id === borrowerId &&
        l.loan_amount === amount &&
        (l.status === "pending" || l.status === "active") &&
        now - new Date(l.created_at).getTime() < cooldownMs
    );

    if (recentDuplicate) {
      const minutesAgo = Math.round(
        (now - new Date(recentDuplicate.created_at).getTime()) / 60000
      );

      this.logEvent({
        type: "duplicate_loan_blocked",
        userId: lenderId,
        message: `Duplicate loan blocked: $${amount} to borrower ${borrowerId}, original created ${minutesAgo}m ago`,
        severity: "warning",
        metadata: { originalLoanId: recentDuplicate.loan_id, amount, borrowerId },
      });

      return {
        allowed: false,
        reason: `A similar loan of $${amount.toLocaleString()} to this borrower was created ${minutesAgo} minute${minutesAgo !== 1 ? "s" : ""} ago. Please wait ${SECURITY.DUPLICATE_LOAN_COOLDOWN_MINUTES - minutesAgo} more minute${SECURITY.DUPLICATE_LOAN_COOLDOWN_MINUTES - minutesAgo !== 1 ? "s" : ""} or change the amount.`,
        warnings,
      };
    }

    return { allowed: true, warnings };
  }

  /**
   * Check if too many active loans exist between the same two users.
   */
  checkActiveLoansLimit(
    lenderId: string,
    borrowerId: string,
    existingLoans: Loan[]
  ): SecurityValidationResult {
    const warnings: string[] = [];

    const activeLoansBetweenUsers = existingLoans.filter(
      (l) =>
        ((l.lender_id === lenderId && l.borrower_id === borrowerId) ||
          (l.lender_id === borrowerId && l.borrower_id === lenderId)) &&
        (l.status === "active" || l.status === "pending")
    ).length;

    if (activeLoansBetweenUsers >= SECURITY.MAX_ACTIVE_LOANS_BETWEEN_USERS) {
      this.logEvent({
        type: "max_active_loans_exceeded",
        userId: lenderId,
        message: `Max active loans between users reached (${activeLoansBetweenUsers}/${SECURITY.MAX_ACTIVE_LOANS_BETWEEN_USERS})`,
        severity: "warning",
        metadata: { lenderId, borrowerId, count: activeLoansBetweenUsers },
      });

      return {
        allowed: false,
        reason: `You already have ${activeLoansBetweenUsers} active/pending loans with this person. Complete or cancel existing loans first.`,
        warnings,
      };
    }

    if (activeLoansBetweenUsers >= SECURITY.MAX_ACTIVE_LOANS_BETWEEN_USERS - 1) {
      warnings.push(
        `You have ${activeLoansBetweenUsers} active loans with this person. Consider settling existing loans.`
      );
    }

    return { allowed: true, warnings };
  }

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Comprehensive loan input validation with security checks.
   */
  validateLoanInput(params: {
    userId: string;
    borrowerId: string;
    amount: number;
    interestRate: number;
    numberOfPayments: number;
    existingLoans: Loan[];
  }): SecurityValidationResult {
    const warnings: string[] = [];

    // 1. Amount must be positive
    if (params.amount <= 0) {
      this.logEvent({
        type: "invalid_input",
        userId: params.userId,
        message: `Invalid loan amount: ${params.amount}`,
        severity: "warning",
      });
      return { allowed: false, reason: "Loan amount must be greater than $0.", warnings };
    }

    if (params.amount > 1_000_000) {
      return { allowed: false, reason: "Loan amount cannot exceed $1,000,000.", warnings };
    }

    // 2. Interest rate within reasonable limits
    if (params.interestRate < 0) {
      return { allowed: false, reason: "Interest rate cannot be negative.", warnings };
    }

    if (params.interestRate > 100) {
      return { allowed: false, reason: "Interest rate cannot exceed 100%.", warnings };
    }

    if (params.interestRate > SECURITY.MAX_REASONABLE_INTEREST_RATE) {
      this.logEvent({
        type: "high_interest_rate",
        userId: params.userId,
        message: `High interest rate loan: ${params.interestRate}% on $${params.amount}`,
        severity: "warning",
        metadata: { rate: params.interestRate, amount: params.amount, borrowerId: params.borrowerId },
      });
      warnings.push(
        `Interest rate of ${params.interestRate}% is unusually high. Please confirm this is correct.`
      );
    }

    // 3. Suspicious high amounts
    if (params.amount >= SECURITY.SUSPICIOUS_HIGH_AMOUNT) {
      this.logEvent({
        type: "suspicious_amount",
        userId: params.userId,
        message: `High-value loan: $${params.amount.toLocaleString()} to borrower ${params.borrowerId}`,
        severity: "warning",
        metadata: { amount: params.amount, borrowerId: params.borrowerId },
      });
      warnings.push(
        `This is a high-value loan ($${params.amount.toLocaleString()}). Please double-check the amount.`
      );
    }

    // 4. Number of payments validation
    if (params.numberOfPayments < 1 || params.numberOfPayments > 120) {
      return {
        allowed: false,
        reason: "Number of payments must be between 1 and 120.",
        warnings,
      };
    }

    // 5. Self-loan prevention
    if (params.userId === params.borrowerId) {
      this.logEvent({
        type: "invalid_input",
        userId: params.userId,
        message: "Attempted self-loan",
        severity: "warning",
      });
      return { allowed: false, reason: "You cannot create a loan with yourself.", warnings };
    }

    // 6. Rate limit check
    const rateResult = this.checkLoanCreationRateLimit(params.userId, params.existingLoans);
    if (!rateResult.allowed) return rateResult;
    warnings.push(...rateResult.warnings);

    // 7. Duplicate detection
    const dupResult = this.checkDuplicateLoan(
      params.userId,
      params.borrowerId,
      params.amount,
      params.existingLoans
    );
    if (!dupResult.allowed) return dupResult;
    warnings.push(...dupResult.warnings);

    // 8. Active loans limit
    const activeResult = this.checkActiveLoansLimit(
      params.userId,
      params.borrowerId,
      params.existingLoans
    );
    if (!activeResult.allowed) return activeResult;
    warnings.push(...activeResult.warnings);

    return { allowed: true, warnings };
  }

  /**
   * Validate payment registration.
   */
  validatePaymentInput(params: {
    userId: string;
    amount: number;
    remainingBalance: number;
    existingPayments: Payment[];
  }): SecurityValidationResult {
    const warnings: string[] = [];

    if (params.amount <= 0) {
      return { allowed: false, reason: "Payment amount must be greater than $0.", warnings };
    }

    if (params.amount > params.remainingBalance) {
      return {
        allowed: false,
        reason: `Payment amount ($${params.amount.toLocaleString()}) exceeds remaining balance ($${params.remainingBalance.toLocaleString()}).`,
        warnings,
      };
    }

    // Rate limit
    const rateResult = this.checkPaymentRateLimit(params.userId, params.existingPayments);
    if (!rateResult.allowed) return rateResult;
    warnings.push(...rateResult.warnings);

    return { allowed: true, warnings };
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTHENTICATION TOKEN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate a session token for a user.
   */
  generateToken(userId: string): AuthToken {
    const now = Date.now();
    const token: AuthToken = {
      token: `lm_${this._generateSecureId()}_${now}`,
      userId,
      issuedAt: now,
      expiresAt: now + SECURITY.SESSION_TOKEN_EXPIRY_MS,
    };

    this.authToken = token;
    this._saveTokenToStorage(token);

    this.logEvent({
      type: "login_success",
      userId,
      message: "User authenticated, token issued",
      severity: "info",
    });

    return token;
  }

  /**
   * Validate current auth token.
   */
  validateToken(): { valid: boolean; needsRefresh: boolean; token: AuthToken | null } {
    if (!this.authToken) {
      return { valid: false, needsRefresh: false, token: null };
    }

    const now = Date.now();

    if (now >= this.authToken.expiresAt) {
      this.logEvent({
        type: "auth_token_expired",
        userId: this.authToken.userId,
        message: "Auth token expired",
        severity: "info",
      });
      return { valid: false, needsRefresh: false, token: null };
    }

    const needsRefresh =
      this.authToken.expiresAt - now < SECURITY.TOKEN_REFRESH_BUFFER_MS;

    return { valid: true, needsRefresh, token: this.authToken };
  }

  /**
   * Refresh the token for the current user.
   */
  refreshToken(): AuthToken | null {
    const { valid, token } = this.validateToken();
    if (!valid || !token) return null;

    const newToken = this.generateToken(token.userId);

    this.logEvent({
      type: "auth_token_refreshed",
      userId: token.userId,
      message: "Auth token refreshed",
      severity: "info",
    });

    return newToken;
  }

  /**
   * Clear auth token on logout.
   */
  clearToken(): void {
    if (this.authToken) {
      this.logEvent({
        type: "logout",
        userId: this.authToken.userId,
        message: "User logged out, token cleared",
        severity: "info",
      });
    }
    this.authToken = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get the current auth token string for API headers.
   */
  getTokenString(): string | null {
    const { valid, token } = this.validateToken();
    return valid && token ? token.token : null;
  }

  // ═══════════════════════════════════════════════════════════════
  // OTP PROTECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Track OTP attempt and check for lockout.
   */
  checkOTPAttempt(phoneNumber: string): { allowed: boolean; remainingAttempts: number; lockoutUntil?: string } {
    const key = `otp_${phoneNumber.replace(/\D/g, "")}`;
    const stored = localStorage.getItem(STORAGE_KEYS.OTP_ATTEMPTS);
    const attempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }> =
      stored ? JSON.parse(stored) : {};

    const now = Date.now();
    const record = attempts[key] || { count: 0, lastAttempt: 0 };

    // Check if currently locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingMs = record.lockedUntil - now;
      const remainingMins = Math.ceil(remainingMs / 60000);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutUntil: `${remainingMins} minute${remainingMins !== 1 ? "s" : ""}`,
      };
    }

    // Reset if lockout expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      record.count = 0;
      record.lockedUntil = undefined;
    }

    return {
      allowed: true,
      remainingAttempts: SECURITY.MAX_OTP_ATTEMPTS - record.count,
    };
  }

  /**
   * Record a failed OTP attempt.
   */
  recordFailedOTP(phoneNumber: string): void {
    const key = `otp_${phoneNumber.replace(/\D/g, "")}`;
    const stored = localStorage.getItem(STORAGE_KEYS.OTP_ATTEMPTS);
    const attempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }> =
      stored ? JSON.parse(stored) : {};

    const now = Date.now();
    const record = attempts[key] || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= SECURITY.MAX_OTP_ATTEMPTS) {
      record.lockedUntil = now + SECURITY.OTP_LOCKOUT_MINUTES * 60 * 1000;
      this.logEvent({
        type: "otp_lockout",
        userId: phoneNumber,
        message: `OTP lockout triggered after ${record.count} failed attempts`,
        severity: "critical",
        metadata: { phone: phoneNumber, attempts: record.count },
      });
    } else {
      this.logEvent({
        type: "otp_failed_attempt",
        userId: phoneNumber,
        message: `Failed OTP attempt #${record.count}`,
        severity: "warning",
        metadata: { phone: phoneNumber, attempts: record.count },
      });
    }

    attempts[key] = record;
    localStorage.setItem(STORAGE_KEYS.OTP_ATTEMPTS, JSON.stringify(attempts));
  }

  /**
   * Clear OTP attempts on successful verification.
   */
  clearOTPAttempts(phoneNumber: string): void {
    const key = `otp_${phoneNumber.replace(/\D/g, "")}`;
    const stored = localStorage.getItem(STORAGE_KEYS.OTP_ATTEMPTS);
    const attempts: Record<string, { count: number; lastAttempt: number; lockedUntil?: number }> =
      stored ? JSON.parse(stored) : {};
    delete attempts[key];
    localStorage.setItem(STORAGE_KEYS.OTP_ATTEMPTS, JSON.stringify(attempts));
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTIVITY LOGGING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Log a security event.
   */
  logEvent(event: Omit<SecurityEvent, "id" | "timestamp">): void {
    const entry: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.activityLog.unshift(entry);

    // Keep last 500 events
    if (this.activityLog.length > 500) {
      this.activityLog = this.activityLog.slice(0, 500);
    }

    this._saveLogToStorage();

    // Console output for critical events during development
    if (entry.severity === "critical") {
      console.warn(`[SECURITY CRITICAL] ${entry.type}: ${entry.message}`, entry.metadata);
    } else if (entry.severity === "warning") {
      console.info(`[SECURITY WARNING] ${entry.type}: ${entry.message}`, entry.metadata);
    }
  }

  /**
   * Get recent security events.
   */
  getActivityLog(limit = 50): SecurityEvent[] {
    return this.activityLog.slice(0, limit);
  }

  /**
   * Get events by severity.
   */
  getEventsBySeverity(severity: SecurityEvent["severity"]): SecurityEvent[] {
    return this.activityLog.filter((e) => e.severity === severity);
  }

  /**
   * Get events for a specific user.
   */
  getUserEvents(userId: string, limit = 20): SecurityEvent[] {
    return this.activityLog.filter((e) => e.userId === userId).slice(0, limit);
  }

  /**
   * Clear all logs.
   */
  clearActivityLog(): void {
    this.activityLog = [];
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOG);
  }

  // ═══════════════════════════════════════════════════════════════
  // INPUT SANITIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Sanitize user text input (notes, names, etc.).
   */
  sanitizeTextInput(input: string, maxLength = 500): string {
    return input
      .replace(/<[^>]*>/g, "") // Strip HTML tags
      .replace(/[<>'"`;]/g, "") // Remove potential injection chars
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Sanitize numeric input.
   */
  sanitizeAmount(input: string): number {
    const cleaned = input.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private _generateSecureId(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  private _loadFromStorage(): void {
    try {
      const logData = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      if (logData) {
        this.activityLog = JSON.parse(logData);
      }

      const tokenData = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (tokenData) {
        this.authToken = JSON.parse(tokenData);
      }
    } catch {
      // If storage is corrupted, start fresh
      this.activityLog = [];
      this.authToken = null;
    }
  }

  private _saveLogToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ACTIVITY_LOG,
        JSON.stringify(this.activityLog.slice(0, 100)) // Only persist last 100
      );
    } catch {
      // Storage full — silently fail
    }
  }

  private _saveTokenToStorage(token: AuthToken): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(token));
    } catch {
      // Storage full — silently fail
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────────
export const securityService = new SecurityService();
export default SecurityService;
