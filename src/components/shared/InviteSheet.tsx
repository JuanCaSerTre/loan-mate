/**
 * LoanMate — InviteSheet
 * A bottom-sheet style modal that provides multiple invitation methods:
 * SMS, WhatsApp, and Copy Link.
 * Used from ContactsScreen and anywhere an invite action is triggered.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  Share2,
  Sparkles,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

interface InviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contactName?: string;
  contactPhone?: string;
  senderName: string;
  onSendSMS: (
    phone: string,
    name?: string
  ) => Promise<{ success: boolean }>;
  onSendWhatsApp: (
    phone: string,
    name?: string
  ) => Promise<{ success: boolean }>;
  onCopyLink: () => Promise<{ success: boolean }>;
  getInvitationMessage: (name?: string) => string;
}

// WhatsApp SVG icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function InviteSheet({
  isOpen,
  onClose,
  contactName,
  contactPhone,
  senderName,
  onSendSMS,
  onSendWhatsApp,
  onCopyLink,
  getInvitationMessage,
}: InviteSheetProps) {
  const [sendingMethod, setSendingMethod] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteMessage = getInvitationMessage(contactName);

  const handleSMS = async () => {
    if (!contactPhone) return;
    setSendingMethod("sms");
    const { success } = await onSendSMS(contactPhone, contactName);
    setSendingMethod(null);
    if (success) {
      toast.success(`SMS invitation sent to ${contactName || contactPhone}!`, {
        icon: "📱",
      });
      onClose();
    } else {
      toast.error("Failed to send SMS invitation");
    }
  };

  const handleWhatsApp = async () => {
    if (!contactPhone) return;
    setSendingMethod("whatsapp");
    const { success } = await onSendWhatsApp(contactPhone, contactName);
    setSendingMethod(null);
    if (success) {
      toast.success(
        `WhatsApp invitation sent to ${contactName || contactPhone}!`,
        { icon: "💬" }
      );
      onClose();
    } else {
      toast.error("Failed to share via WhatsApp");
    }
  };

  const handleCopyLink = async () => {
    setSendingMethod("copy");
    const { success } = await onCopyLink();
    setSendingMethod(null);
    if (success) {
      setCopiedLink(true);
      toast.success("Invitation link copied to clipboard!", { icon: "📋" });
      setTimeout(() => setCopiedLink(false), 3000);
    } else {
      toast.error("Failed to copy link");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#1B2E4B]/5 flex items-center justify-center">
                    <Share2 className="w-4.5 h-4.5 text-[#1B2E4B]" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-base">
                      Invite{contactName ? ` ${contactName}` : " a Friend"}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      Choose how to send the invitation
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Message Preview */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
                    Preview Message
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {inviteMessage}
                </p>
              </div>

              {/* Invitation Methods */}
              <div className="space-y-2.5">
                {/* SMS */}
                {contactPhone && (
                  <button
                    onClick={handleSMS}
                    disabled={sendingMethod !== null}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {sendingMethod === "sms" ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-900 font-semibold text-sm">
                        Send via SMS
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {contactPhone}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </button>
                )}

                {/* WhatsApp */}
                {contactPhone && (
                  <button
                    onClick={handleWhatsApp}
                    disabled={sendingMethod !== null}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      {sendingMethod === "whatsapp" ? (
                        <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                      ) : (
                        <WhatsAppIcon className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-900 font-semibold text-sm">
                        Share via WhatsApp
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Opens WhatsApp with message
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  </button>
                )}

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  disabled={sendingMethod !== null}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    {sendingMethod === "copy" ? (
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    ) : copiedLink ? (
                      <Check className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Link2 className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-gray-900 font-semibold text-sm">
                      {copiedLink ? "Link Copied!" : "Copy Invitation Link"}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Share via any messaging app
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-purple-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
