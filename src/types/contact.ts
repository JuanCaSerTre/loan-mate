/**
 * LoanMate — Contact Types
 * Types for phone contact syncing and friend discovery.
 */

export type ContactPermissionStatus = "prompt" | "granted" | "denied";

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  avatar?: string;
}

export interface NormalizedContact extends PhoneContact {
  /** All phone numbers normalized to E.164 format */
  normalizedNumbers: string[];
}

export interface LoanMateFriend {
  contact: NormalizedContact;
  /** The matched LoanMate user */
  userId: string;
  userName: string;
  userAvatar?: string;
  userPhone: string;
}

export interface InvitableContact {
  contact: NormalizedContact;
  /** The primary phone number to send invitation to */
  invitePhone: string;
}
