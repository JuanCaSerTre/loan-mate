/**
 * LoanMate — Invitation Service
 * Handles invitation link generation, sharing methods (SMS, WhatsApp, copy),
 * referral code tracking, and invitation metrics calculation.
 */
import {
  Invitation,
  InvitationMethod,
  InvitationMetrics,
  InvitationLink,
} from "@/types/invitation";

// ─── Constants ───────────────────────────────────────────────────

/** Base URL for the app — in production this would be a dynamic link / deep link */
const APP_BASE_URL = "https://juca.app";
const APP_DOWNLOAD_URL = `${APP_BASE_URL}/download`;

// ─── Referral Code Generation ────────────────────────────────────

/**
 * Generate a unique referral code.
 * Format: LM-XXXXXX (6 alphanumeric characters)
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LM-${code}`;
}

// ─── Invitation Link Generation ──────────────────────────────────

/**
 * Generate a personalized invitation link and message.
 */
export function generateInvitationLink(
  senderName: string,
  referralCode: string
): InvitationLink {
  const url = `${APP_DOWNLOAD_URL}?ref=${referralCode}`;
  const message = `Hola, acabo de registrar un acuerdo en JUCA para llevar un seguimiento fácil. Descarga la app aquí: ${url}`;

  return {
    url,
    referral_code: referralCode,
    message,
  };
}

/**
 * Generate a personalized message for a specific contact.
 */
export function generatePersonalizedMessage(
  senderName: string,
  recipientName: string,
  referralCode: string
): string {
  const url = `${APP_DOWNLOAD_URL}?ref=${referralCode}`;
  return `Hola ${recipientName}, acabo de registrar un acuerdo en JUCA para llevar un seguimiento fácil. Descarga la app aquí: ${url}`;
}

// ─── SMS Invitation ──────────────────────────────────────────────

/**
 * Generate an SMS URI with pre-filled invitation message.
 * Works on both iOS and Android.
 */
export function generateSMSInviteURI(
  phone: string,
  senderName: string,
  referralCode: string
): string {
  const { message } = generateInvitationLink(senderName, referralCode);
  const encodedMessage = encodeURIComponent(message);
  // sms: URI — use `&body=` for iOS, `?body=` works on both
  return `sms:${phone}?body=${encodedMessage}`;
}

/**
 * Simulate sending an SMS invitation.
 * In production, this would call an SMS API (Twilio, etc.)
 */
export async function sendSMSInvitation(
  phone: string,
  senderName: string,
  referralCode: string
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log(
    `[InvitationService] SMS invitation sent to ${phone} from ${senderName} (ref: ${referralCode})`
  );
  return true;
}

// ─── WhatsApp Invitation ─────────────────────────────────────────

/**
 * Generate a WhatsApp share URI with pre-filled invitation message.
 * Uses the wa.me deep link format.
 */
export function generateWhatsAppURI(
  phone: string,
  senderName: string,
  referralCode: string
): string {
  const { message } = generateInvitationLink(senderName, referralCode);
  const encodedMessage = encodeURIComponent(message);
  // Remove non-digits from phone for WhatsApp format
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate a WhatsApp share URI without a specific phone number.
 * Opens WhatsApp's contact picker.
 */
export function generateWhatsAppShareURI(
  senderName: string,
  referralCode: string
): string {
  const { message } = generateInvitationLink(senderName, referralCode);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

// ─── Copy Link ───────────────────────────────────────────────────

/**
 * Copy the invitation link to clipboard.
 * Returns true on success.
 */
export async function copyInvitationLink(
  senderName: string,
  referralCode: string
): Promise<boolean> {
  const { message } = generateInvitationLink(senderName, referralCode);
  try {
    await navigator.clipboard.writeText(message);
    console.log(
      `[InvitationService] Invitation link copied (ref: ${referralCode})`
    );
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      console.error("[InvitationService] Failed to copy to clipboard:", err);
      return false;
    }
  }
}

// ─── Invitation Record Creation ──────────────────────────────────

/**
 * Create a new invitation record.
 */
export function createInvitationRecord(
  inviterId: string,
  inviterName: string,
  method: InvitationMethod,
  inviteePhone?: string,
  inviteeName?: string
): Invitation {
  const referralCode = generateReferralCode();
  const { url } = generateInvitationLink(inviterName, referralCode);

  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    inviter_id: inviterId,
    inviter_name: inviterName,
    invitee_phone: inviteePhone,
    invitee_name: inviteeName,
    method,
    status: "sent",
    referral_code: referralCode,
    invitation_link: url,
    created_at: new Date().toISOString(),
  };
}

// ─── Metrics Calculation ─────────────────────────────────────────

/**
 * Calculate invitation metrics from a list of invitations.
 */
export function calculateInvitationMetrics(
  invitations: Invitation[]
): InvitationMetrics {
  const total_sent = invitations.length;
  const sms_sent = invitations.filter((i) => i.method === "sms").length;
  const whatsapp_sent = invitations.filter(
    (i) => i.method === "whatsapp"
  ).length;
  const link_copied = invitations.filter(
    (i) => i.method === "copy_link"
  ).length;
  const registrations = invitations.filter(
    (i) => i.status === "registered" || i.status === "connected"
  ).length;
  const connections = invitations.filter(
    (i) => i.status === "connected"
  ).length;
  const conversion_rate =
    total_sent > 0 ? Math.round((registrations / total_sent) * 100) : 0;

  return {
    total_sent,
    sms_sent,
    whatsapp_sent,
    link_copied,
    registrations,
    connections,
    conversion_rate,
  };
}

// ─── Referral Code Validation ────────────────────────────────────

/**
 * Validate a referral code format.
 */
export function isValidReferralCode(code: string): boolean {
  return /^LM-[A-Z0-9]{6}$/.test(code);
}

/**
 * Simulate looking up an invitation by referral code.
 * In production, this would hit the backend.
 */
export async function lookupInvitationByCode(
  code: string,
  invitations: Invitation[]
): Promise<Invitation | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return invitations.find((i) => i.referral_code === code) || null;
}
