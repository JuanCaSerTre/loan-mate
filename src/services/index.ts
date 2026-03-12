/**
 * LoanMate — Services Index
 * Single import point for all API services.
 */
export { apiClient } from "./api/client";
export type { ApiResponse, ApiError } from "./api/client";

export { authService } from "./api/authService";
export type { AuthSession, OTPResult } from "./api/authService";

export { loanService } from "./api/loanService";
export { paymentService } from "./api/paymentService";
export { notificationService } from "./api/notificationService";
export { userService } from "./api/userService";
