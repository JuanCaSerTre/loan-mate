/**
 * LoanMate — Invitation Types
 * Types for the user invitation & referral system.
 */

export type InvitationMethod = "sms" | "whatsapp" | "copy_link";
export type InvitationStatus = "sent" | "opened" | "registered" | "connected";

export interface Invitation {
  id: string;
  /** The user who sent the invitation */
  inviter_id: string;
  inviter_name: string;
  /** Phone number of the person being invited (if known) */
  invitee_phone?: string;
  /** Name from contacts (if available) */
  invitee_name?: string;
  /** How the invitation was sent */
  method: InvitationMethod;
  /** Current status of the invitation */
  status: InvitationStatus;
  /** Unique referral code for this invitation */
  referral_code: string;
  /** The full invitation link */
  invitation_link: string;
  /** When the invitation was created */
  created_at: string;
  /** When the invitee registered (if they did) */
  registered_at?: string;
  /** When the connection was established */
  connected_at?: string;
}

export interface InvitationMetrics {
  /** Total invitations sent */
  total_sent: number;
  /** Invitations sent via SMS */
  sms_sent: number;
  /** Invitations sent via WhatsApp */
  whatsapp_sent: number;
  /** Invitations where link was copied */
  link_copied: number;
  /** Invitations where the person registered */
  registrations: number;
  /** Invitations that resulted in a connection */
  connections: number;
  /** Conversion rate (registrations / total_sent) */
  conversion_rate: number;
}

export interface InvitationLink {
  /** The full invitation URL */
  url: string;
  /** Short referral code */
  referral_code: string;
  /** Pre-formatted invitation message */
  message: string;
}
