/**
 * LoanMate — useInvitations Hook
 * Manages invitation state, sending invitations via SMS/WhatsApp/link,
 * and tracking invitation metrics for analytics.
 */
import { useState, useCallback, useMemo } from "react";
import {
  Invitation,
  InvitationMethod,
  InvitationMetrics,
} from "@/types/invitation";
import { mockInvitations } from "@/data/mockInvitations";
import {
  createInvitationRecord,
  sendSMSInvitation,
  generateSMSInviteURI,
  generateWhatsAppURI,
  generateWhatsAppShareURI,
  copyInvitationLink,
  calculateInvitationMetrics,
  generateReferralCode,
  generateInvitationLink,
} from "@/services/invitationService";

interface UseInvitationsReturn {
  /** All invitations sent by the current user */
  invitations: Invitation[];
  /** Whether an invitation is currently being sent */
  isSending: boolean;
  /** Computed analytics metrics */
  metrics: InvitationMetrics;
  /** The user's personal referral code (persistent) */
  personalReferralCode: string;
  /** Send an SMS invitation to a specific phone number */
  sendSMS: (
    phone: string,
    contactName?: string
  ) => Promise<{ success: boolean; invitation?: Invitation }>;
  /** Open WhatsApp with invitation message for a specific contact */
  sendWhatsApp: (
    phone: string,
    contactName?: string
  ) => Promise<{ success: boolean; invitation?: Invitation }>;
  /** Open WhatsApp contact picker with invitation message */
  shareViaWhatsApp: () => Promise<{
    success: boolean;
    invitation?: Invitation;
  }>;
  /** Copy invitation link to clipboard */
  copyLink: () => Promise<{ success: boolean; invitation?: Invitation }>;
  /** Get the invitation message text */
  getInvitationMessage: (recipientName?: string) => string;
  /** Check if a phone number has already been invited */
  isPhoneInvited: (phone: string) => boolean;
  /** Get invitation status for a phone number */
  getInvitationForPhone: (phone: string) => Invitation | undefined;
}

export function useInvitations(
  userId: string,
  userName: string
): UseInvitationsReturn {
  const [invitations, setInvitations] =
    useState<Invitation[]>(mockInvitations);
  const [isSending, setIsSending] = useState(false);

  // Generate a persistent personal referral code for the user
  const personalReferralCode = useMemo(() => {
    // In production, this would be stored in the user profile
    // For now, derive a deterministic code from the user ID
    const seed = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    let s = seed;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(s % chars.length);
      s = Math.floor(s / chars.length) + (seed * (i + 1)) % 100;
    }
    return `LM-${code}`;
  }, [userId]);

  // Calculate metrics
  const metrics = useMemo(
    () => calculateInvitationMetrics(invitations),
    [invitations]
  );

  // Add an invitation record
  const addInvitation = useCallback((invitation: Invitation) => {
    setInvitations((prev) => [invitation, ...prev]);
  }, []);

  // ─── SMS ───────────────────────────────────────────────────────

  const sendSMS = useCallback(
    async (
      phone: string,
      contactName?: string
    ): Promise<{ success: boolean; invitation?: Invitation }> => {
      setIsSending(true);
      try {
        const invitation = createInvitationRecord(
          userId,
          userName,
          "sms",
          phone,
          contactName
        );

        // Try native SMS URI first
        const smsURI = generateSMSInviteURI(
          phone,
          userName,
          invitation.referral_code
        );
        window.open(smsURI, "_blank");

        // Also simulate the backend record
        await sendSMSInvitation(phone, userName, invitation.referral_code);

        addInvitation(invitation);
        return { success: true, invitation };
      } catch (err) {
        console.error("[useInvitations] SMS send failed:", err);
        return { success: false };
      } finally {
        setIsSending(false);
      }
    },
    [userId, userName, addInvitation]
  );

  // ─── WhatsApp ──────────────────────────────────────────────────

  const sendWhatsApp = useCallback(
    async (
      phone: string,
      contactName?: string
    ): Promise<{ success: boolean; invitation?: Invitation }> => {
      setIsSending(true);
      try {
        const invitation = createInvitationRecord(
          userId,
          userName,
          "whatsapp",
          phone,
          contactName
        );

        const waURI = generateWhatsAppURI(
          phone,
          userName,
          invitation.referral_code
        );
        window.open(waURI, "_blank");

        addInvitation(invitation);
        return { success: true, invitation };
      } catch (err) {
        console.error("[useInvitations] WhatsApp send failed:", err);
        return { success: false };
      } finally {
        setIsSending(false);
      }
    },
    [userId, userName, addInvitation]
  );

  const shareViaWhatsApp = useCallback(async (): Promise<{
    success: boolean;
    invitation?: Invitation;
  }> => {
    setIsSending(true);
    try {
      const invitation = createInvitationRecord(
        userId,
        userName,
        "whatsapp"
      );

      const waURI = generateWhatsAppShareURI(
        userName,
        invitation.referral_code
      );
      window.open(waURI, "_blank");

      addInvitation(invitation);
      return { success: true, invitation };
    } catch (err) {
      console.error("[useInvitations] WhatsApp share failed:", err);
      return { success: false };
    } finally {
      setIsSending(false);
    }
  }, [userId, userName, addInvitation]);

  // ─── Copy Link ─────────────────────────────────────────────────

  const copyLink = useCallback(async (): Promise<{
    success: boolean;
    invitation?: Invitation;
  }> => {
    setIsSending(true);
    try {
      const invitation = createInvitationRecord(
        userId,
        userName,
        "copy_link"
      );

      const success = await copyInvitationLink(
        userName,
        invitation.referral_code
      );

      if (success) {
        addInvitation(invitation);
        return { success: true, invitation };
      }
      return { success: false };
    } catch (err) {
      console.error("[useInvitations] Copy link failed:", err);
      return { success: false };
    } finally {
      setIsSending(false);
    }
  }, [userId, userName, addInvitation]);

  // ─── Helpers ───────────────────────────────────────────────────

  const getInvitationMessage = useCallback(
    (recipientName?: string): string => {
      const { message } = generateInvitationLink(
        userName,
        personalReferralCode
      );
      if (recipientName) {
        return message.replace("Hey,", `Hey ${recipientName},`);
      }
      return message;
    },
    [userName, personalReferralCode]
  );

  const isPhoneInvited = useCallback(
    (phone: string): boolean => {
      const normalized = phone.replace(/\D/g, "");
      return invitations.some(
        (i) =>
          i.invitee_phone &&
          i.invitee_phone.replace(/\D/g, "").includes(normalized)
      );
    },
    [invitations]
  );

  const getInvitationForPhone = useCallback(
    (phone: string): Invitation | undefined => {
      const normalized = phone.replace(/\D/g, "");
      return invitations.find(
        (i) =>
          i.invitee_phone &&
          i.invitee_phone.replace(/\D/g, "").includes(normalized)
      );
    },
    [invitations]
  );

  return {
    invitations,
    isSending,
    metrics,
    personalReferralCode,
    sendSMS,
    sendWhatsApp,
    shareViaWhatsApp,
    copyLink,
    getInvitationMessage,
    isPhoneInvited,
    getInvitationForPhone,
  };
}
