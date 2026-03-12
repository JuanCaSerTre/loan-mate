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

export { pushNotificationService } from "./pushNotificationService";
export { checkPaymentReminders } from "./paymentReminderService";

export { securityService } from "./securityService";
export type {
  SecurityEvent,
  SecurityEventType,
  SecurityValidationResult,
  AuthToken,
} from "./securityService";

// Invitation & contact services
export {
  generateReferralCode,
  generateInvitationLink,
  generateSMSInviteURI,
  generateWhatsAppURI,
  generateWhatsAppShareURI,
  copyInvitationLink,
  createInvitationRecord,
  calculateInvitationMetrics,
  isValidReferralCode,
} from "./invitationService";
export {
  normalizePhoneNumber,
  matchContacts,
  sendInvitation,
} from "./contactService";

// Analytics
export {
  identifyUser,
  clearUser,
  trackDailyActiveUser,
  trackUserSignup,
  trackLoanCreated,
  trackLoanAccepted,
  trackLoanRejected,
  trackPaymentRegistered,
  trackPaymentConfirmed,
  trackLoanCompleted,
  trackComputedMetrics,
} from "./analyticsService";
