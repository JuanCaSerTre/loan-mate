import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Send,
  UserPlus,
  RefreshCw,
  Phone,
  ShieldCheck,
  Check,
  Loader2,
  CreditCard,
  BookUser,
  Share2,
  Copy,
  Link2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useContacts } from "@/hooks/useContacts";
import { useInvitations } from "@/hooks/useInvitations";
import AvatarBadge from "@/components/shared/AvatarBadge";
import InviteSheet from "@/components/shared/InviteSheet";
import InviteMetricsCard from "@/components/shared/InviteMetricsCard";
import { toast } from "sonner";
import { LoanMateFriend, InvitableContact } from "@/types/contact";

type Tab = "friends" | "invite";

export default function ContactsScreen() {
  const { currentUser, users, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<InvitableContact | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  const {
    permissionStatus,
    isLoaded,
    isSyncing,
    requestPermissionAndSync,
    resync,
    invite,
    invitedPhones,
    searchQuery,
    setSearchQuery,
    filteredFriends,
    filteredInvitable,
  } = useContacts(users, currentUser?.id || "");

  const {
    sendSMS,
    sendWhatsApp,
    copyLink,
    getInvitationMessage,
    metrics,
    isPhoneInvited,
    invitations,
  } = useInvitations(currentUser?.id || "", currentUser?.name || "");

  const handleOpenInviteSheet = (contact: InvitableContact) => {
    setSelectedContact(contact);
    setInviteSheetOpen(true);
  };

  const handleQuickInvite = async (contact: InvitableContact) => {
    if (!currentUser) return;
    const success = await invite(contact.invitePhone, currentUser.name);
    if (success) {
      toast.success(`Invitation sent to ${contact.contact.name}!`, {
        description: `SMS sent to ${contact.invitePhone}`,
      });
    } else {
      toast.error("Failed to send invitation");
    }
  };

  const handleCreateLoanFromContact = (friend: LoanMateFriend) => {
    navigate("create-loan");
    toast.success(`Creating loan with ${friend.userName}`, {
      description: "Fill in the loan terms",
    });
  };

  const handleCopyGeneralLink = async () => {
    const { success } = await copyLink();
    if (success) {
      toast.success("Invitation link copied!", {
        icon: "📋",
        description: "Share it with anyone",
      });
    }
  };

  // ─── Permission Not Yet Granted ──────────────────────────────
  if (permissionStatus === "prompt" && !isLoaded) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B2E4B] px-5 pt-12 pb-6 rounded-b-[32px]">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h2 className="text-white text-xl font-bold">Contacts</h2>
            <p className="text-white/60 text-sm mt-0.5">
              Find friends on LoanMate
            </p>
          </motion.div>
        </div>

        {/* Permission Request Card */}
        <div className="flex-1 flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-[#1B2E4B]/5 flex items-center justify-center mx-auto mb-4">
                <BookUser className="w-8 h-8 text-[#1B2E4B]" />
              </div>
              <h3 className="text-gray-900 text-lg font-bold mb-2">
                Sync Your Contacts
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Find which of your friends already use LoanMate. Create loans
                instantly by selecting a contact.
              </p>

              {/* Privacy badge */}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-700 text-xs text-left">
                  Your contacts are never stored on our servers. Only used for
                  matching — then discarded.
                </p>
              </div>

              <button
                onClick={requestPermissionAndSync}
                disabled={isSyncing}
                className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base active:scale-[0.98] transition-all shadow-lg shadow-[#1B2E4B]/20 flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>Allow Contact Access</span>
                  </>
                )}
              </button>

              {/* Quick share link even without contacts */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-3">
                  Or share your personal invitation link
                </p>
                <button
                  onClick={handleCopyGeneralLink}
                  className="w-full h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Invitation Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Permission Denied ──────────────────────────────────────
  if (permissionStatus === "denied") {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
        <div className="bg-[#1B2E4B] px-5 pt-12 pb-6 rounded-b-[32px]">
          <h2 className="text-white text-xl font-bold">Contacts</h2>
          <p className="text-white/60 text-sm mt-0.5">Permission required</p>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">
              Contact Access Denied
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Please enable contact access in your device settings.
            </p>
            <button
              onClick={requestPermissionAndSync}
              className="px-6 h-12 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-sm mb-4"
            >
              Try Again
            </button>
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={handleCopyGeneralLink}
                className="px-6 h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 mx-auto hover:bg-gray-50"
              >
                <Link2 className="w-4 h-4" />
                Copy Invitation Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Contacts View ────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="bg-[#1B2E4B] px-5 pt-12 pb-5 rounded-b-[32px]">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-white text-xl font-bold">Contacts</h2>
            <p className="text-white/60 text-sm mt-0.5">
              {filteredFriends.length} friend
              {filteredFriends.length !== 1 ? "s" : ""} on LoanMate
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy general link button */}
            <button
              onClick={handleCopyGeneralLink}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              title="Copy invitation link"
            >
              <Share2 className="w-5 h-5 text-white/70" />
            </button>
            <button
              onClick={resync}
              disabled={isSyncing}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <RefreshCw
                className={`w-5 h-5 text-white/70 ${isSyncing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/30"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex mt-4 bg-white/10 rounded-xl p-1"
        >
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "friends"
                ? "bg-white text-[#1B2E4B] shadow-sm"
                : "text-white/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            LoanMate Friends
            {filteredFriends.length > 0 && (
              <span
                className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeTab === "friends"
                    ? "bg-[#1B2E4B] text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                {filteredFriends.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("invite")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "invite"
                ? "bg-white text-[#1B2E4B] shadow-sm"
                : "text-white/60"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite
            {filteredInvitable.length > 0 && (
              <span
                className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeTab === "invite"
                    ? "bg-[#1B2E4B] text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                {filteredInvitable.length}
              </span>
            )}
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        {isSyncing && !isLoaded ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#1B2E4B] animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Syncing contacts...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "friends" ? (
              <motion.div
                key="friends"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {filteredFriends.length === 0 ? (
                  <div className="flex flex-col items-center py-16">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                      {searchQuery
                        ? "No friends match your search"
                        : "No contacts found on LoanMate yet"}
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      Invite your friends to get started
                    </p>
                    <button
                      onClick={() => setActiveTab("invite")}
                      className="mt-4 px-5 h-10 rounded-xl bg-[#1B2E4B] text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Invite Friends
                    </button>
                  </div>
                ) : (
                  filteredFriends.map((friend, idx) => (
                    <FriendCard
                      key={friend.userId}
                      friend={friend}
                      index={idx}
                      onCreateLoan={() => handleCreateLoanFromContact(friend)}
                    />
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="invite"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {/* Quick share card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-[#1B2E4B] to-[#2A4365] rounded-2xl p-4 mb-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-white/80" />
                    <span className="text-white text-xs font-semibold">
                      Quick Share
                    </span>
                  </div>
                  <p className="text-white/60 text-xs mb-3">
                    Share your personal link with anyone to invite them
                  </p>
                  <button
                    onClick={handleCopyGeneralLink}
                    className="w-full h-10 rounded-xl bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy My Invitation Link
                  </button>
                </motion.div>

                {/* Metrics toggle */}
                {invitations.length > 0 && (
                  <div className="mb-2">
                    <button
                      onClick={() => setShowMetrics(!showMetrics)}
                      className="text-xs text-[#1B2E4B] font-semibold flex items-center gap-1 mb-2"
                    >
                      {showMetrics ? "Hide" : "Show"} Invitation Stats
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 font-normal">
                        {metrics.total_sent} sent
                      </span>
                    </button>
                    <AnimatePresence>
                      {showMetrics && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-2"
                        >
                          <InviteMetricsCard metrics={metrics} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {filteredInvitable.length === 0 ? (
                  <div className="flex flex-col items-center py-16">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <UserPlus className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                      {searchQuery
                        ? "No contacts match your search"
                        : "All your contacts are already on LoanMate!"}
                    </p>
                  </div>
                ) : (
                  filteredInvitable.map((contact, idx) => (
                    <InviteCard
                      key={contact.contact.id}
                      contact={contact}
                      index={idx}
                      isInvited={
                        invitedPhones.has(contact.invitePhone) ||
                        isPhoneInvited(contact.invitePhone)
                      }
                      onQuickInvite={() => handleQuickInvite(contact)}
                      onOpenSheet={() => handleOpenInviteSheet(contact)}
                    />
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Invite Sheet */}
      <InviteSheet
        isOpen={inviteSheetOpen}
        onClose={() => {
          setInviteSheetOpen(false);
          setSelectedContact(null);
        }}
        contactName={selectedContact?.contact.name}
        contactPhone={selectedContact?.invitePhone}
        senderName={currentUser?.name || ""}
        onSendSMS={sendSMS}
        onSendWhatsApp={sendWhatsApp}
        onCopyLink={copyLink}
        getInvitationMessage={getInvitationMessage}
      />
    </div>
  );
}

// ─── Friend Card ─────────────────────────────────────────────────

function FriendCard({
  friend,
  index,
  onCreateLoan,
}: {
  friend: LoanMateFriend;
  index: number;
  onCreateLoan: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <AvatarBadge
          initials={friend.userAvatar || friend.userName.slice(0, 2)}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold text-sm truncate">
            {friend.userName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-gray-400 text-xs truncate">
              {friend.contact.name}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5 flex-shrink-0">
              <Check className="w-2.5 h-2.5" />
              On LoanMate
            </span>
          </div>
        </div>
        <button
          onClick={onCreateLoan}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#1B2E4B] text-white text-xs font-semibold active:scale-[0.96] transition-transform flex-shrink-0"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Lend
        </button>
      </div>
    </motion.div>
  );
}

// ─── Invite Card (Enhanced with multi-method) ────────────────────

function InviteCard({
  contact,
  index,
  isInvited,
  onQuickInvite,
  onOpenSheet,
}: {
  contact: InvitableContact;
  index: number;
  isInvited: boolean;
  onQuickInvite: () => void;
  onOpenSheet: () => void;
}) {
  const [sending, setSending] = useState(false);

  const handleQuickInvite = async () => {
    setSending(true);
    await onQuickInvite();
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <AvatarBadge
          initials={
            contact.contact.avatar || contact.contact.name.slice(0, 2)
          }
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold text-sm truncate">
            {contact.contact.name}
          </p>
          <p className="text-gray-400 text-xs truncate mt-0.5">
            {contact.contact.phoneNumbers[0]}
          </p>
        </div>
        {isInvited ? (
          <div className="flex items-center gap-1 h-9 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
            Invited
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick SMS invite */}
            <button
              onClick={handleQuickInvite}
              disabled={sending}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 active:scale-[0.96] transition-all"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              SMS
            </button>
            {/* More options */}
            <button
              onClick={onOpenSheet}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-[0.96] transition-all"
              title="More invite options"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
