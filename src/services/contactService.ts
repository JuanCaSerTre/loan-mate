/**
 * LoanMate — Contact Service
 * Handles phone number normalization, contact matching against LoanMate users,
 * and SMS invitation generation.
 *
 * Privacy: Contacts are never stored on any server. Only phone numbers needed
 * for matching are processed in-memory and discarded.
 */
import {
  PhoneContact,
  NormalizedContact,
  LoanMateFriend,
  InvitableContact,
} from "@/types/contact";
import { User } from "@/types/loan";

// ─── Phone Number Normalization ──────────────────────────────────

/**
 * Strip all non-digit characters from a phone number.
 */
function stripNonDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Normalize a phone number to E.164-ish format for matching.
 * Assumes US (+1) if country code is missing.
 *
 * Examples:
 *   "(555) 123-4567"  → "+15551234567"
 *   "555.123.4567"    → "+15551234567"
 *   "+15551234567"    → "+15551234567"
 *   "15551234567"     → "+15551234567"
 */
export function normalizePhoneNumber(phone: string): string {
  // If it starts with +, keep the digits after +
  if (phone.startsWith("+")) {
    const digits = stripNonDigits(phone);
    return `+${digits}`;
  }

  const digits = stripNonDigits(phone);

  // 11 digits starting with 1 → US number with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // 10 digits → assume US, prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Fallback: prepend + if not already
  return `+${digits}`;
}

/**
 * Normalize all phone numbers in a contact.
 */
export function normalizeContact(contact: PhoneContact): NormalizedContact {
  return {
    ...contact,
    normalizedNumbers: contact.phoneNumbers.map(normalizePhoneNumber),
  };
}

/**
 * Normalize a user's phone number for matching.
 */
function normalizeUserPhone(phone: string): string {
  return normalizePhoneNumber(phone);
}

// ─── Contact Matching ────────────────────────────────────────────

/**
 * Match contacts against registered LoanMate users.
 * Returns two lists: friends (on LoanMate) and invitable contacts (not on LoanMate).
 *
 * Privacy: Only normalized numbers are compared in-memory. Nothing is stored.
 */
export function matchContacts(
  contacts: PhoneContact[],
  users: User[],
  currentUserId: string
): {
  friends: LoanMateFriend[];
  invitable: InvitableContact[];
} {
  // Build a lookup: normalized phone → User
  const userByPhone = new Map<string, User>();
  for (const user of users) {
    if (user.id === currentUserId) continue; // Skip self
    const normalized = normalizeUserPhone(user.phone_number);
    userByPhone.set(normalized, user);
  }

  const friends: LoanMateFriend[] = [];
  const invitable: InvitableContact[] = [];

  for (const contact of contacts) {
    const normalized = normalizeContact(contact);
    let matched = false;

    for (const normalizedNum of normalized.normalizedNumbers) {
      const user = userByPhone.get(normalizedNum);
      if (user) {
        friends.push({
          contact: normalized,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          userPhone: user.phone_number,
        });
        matched = true;
        break; // One match is enough
      }
    }

    if (!matched) {
      invitable.push({
        contact: normalized,
        invitePhone: normalized.normalizedNumbers[0] || contact.phoneNumbers[0],
      });
    }
  }

  // Sort: friends alphabetically, invitable alphabetically
  friends.sort((a, b) => a.contact.name.localeCompare(b.contact.name));
  invitable.sort((a, b) => a.contact.name.localeCompare(b.contact.name));

  return { friends, invitable };
}

// ─── SMS Invitation ──────────────────────────────────────────────

/**
 * Generate an SMS invitation link.
 * In a web context, opens the SMS app with a pre-filled message.
 */
export function generateInviteSMSLink(phone: string, senderName: string): string {
  const message = encodeURIComponent(
    `Hey! Estoy usando JUCA para registrar acuerdos con personas de confianza. ¡Únete! 🤝 — ${senderName}`
  );
  // sms: URI works on both iOS and Android
  return `sms:${phone}?body=${message}`;
}

/**
 * Simulate sending an SMS invitation.
 * In production, this would call an SMS API.
 * Returns true on success.
 */
export async function sendInvitation(phone: string, senderName: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log(`[ContactService] SMS invitation sent to ${phone} from ${senderName}`);
  return true;
}
