import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronRight, Shield, HelpCircle, BellOff, BellRing, Loader2, Share2, Copy, Link2, Clock, CalendarDays, AlertTriangle, ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePushContext } from "@/context/PushNotificationContext";
import { useInvitations } from "@/hooks/useInvitations";
import AvatarBadge from "@/components/shared/AvatarBadge";
import InviteMetricsCard from "@/components/shared/InviteMetricsCard";
import { toast } from "sonner";
import { useState } from "react";
import { securityService } from "@/services/securityService";

export default function ProfileScreen() {
  const { currentUser, loans, logout, getSecurityLog } = useApp();
  const { isEnabled, permissionStatus, isSupported, isLoading, enablePush, disablePush, reminderPreferences, updateReminderPreferences } = usePushContext();
  const { metrics, copyLink, personalReferralCode, invitations } = useInvitations(
    currentUser?.id || "",
    currentUser?.name || ""
  );
  const [showSecurityLog, setShowSecurityLog] = useState(false);

  if (!currentUser) return null;

  const loansGiven = loans.filter((l) => l.lender_id === currentUser.id);
  const loansReceived = loans.filter((l) => l.borrower_id === currentUser.id);
  const completedLoans = loans.filter(
    (l) =>
      (l.lender_id === currentUser.id || l.borrower_id === currentUser.id) &&
      l.status === "completed"
  );

  const stats = [
    { label: "Loans Given", value: loansGiven.length, color: "text-[#1B2E4B]" },
    { label: "Loans Received", value: loansReceived.length, color: "text-amber-600" },
    { label: "Completed", value: completedLoans.length, color: "text-emerald-600" },
  ];

  const settings = [
    { icon: Shield, label: "Privacy & Security", desc: "Data & account settings" },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQ & contact us" },
  ];

  const handleCopyLink = async () => {
    const { success } = await copyLink();
    if (success) {
      toast.success("Invitation link copied!", { icon: "📋" });
    } else {
      toast.error("Failed to copy invitation link");
    }
  };

  const handleTogglePush = async () => {
    if (isEnabled) {
      disablePush();
      toast.success("Push notifications disabled");
    } else {
      const success = await enablePush();
      if (success) {
        toast.success("Push notifications enabled!");
      } else if (permissionStatus === "denied") {
        toast.error("Notifications blocked. Please enable in browser settings.");
      } else {
        toast.error("Could not enable notifications");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="bg-[#1B2E4B] px-5 pt-12 pb-6 rounded-b-[32px]">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 z-10 relative"
        >
          <AvatarBadge
            initials={currentUser.avatar || currentUser.name.slice(0, 2)}
            size="lg"
            className="ring-2 ring-white/20"
          />
          <div>
            <h2 className="text-white text-xl font-bold">
              {currentUser.name}
            </h2>
            <p className="text-white/60 text-sm">
              {currentUser.phone_number}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-4">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-gray-400 text-[10px] mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Account info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm"
        >
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Account
          </h3>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Member since</span>
            <span className="text-gray-900 text-sm font-semibold">
              {new Date(currentUser.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Verified phone</span>
            <span className="text-emerald-600 text-sm font-semibold">
              ✓ Verified
            </span>
          </div>
        </motion.div>

        {/* Invite Friends Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-gradient-to-r from-[#1B2E4B] to-[#2A4365] rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-white/80" />
              <h3 className="text-white text-sm font-bold">Invite Friends</h3>
            </div>
            <span className="text-white/40 text-[10px] font-mono">
              {personalReferralCode}
            </span>
          </div>
          <p className="text-white/50 text-xs mb-3">
            Share LoanMate with friends and track loans together
          </p>
          <button
            onClick={handleCopyLink}
            className="w-full h-10 rounded-xl bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy My Invitation Link
          </button>
        </motion.div>

        {/* Invitation Metrics */}
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <InviteMetricsCard metrics={metrics} />
          </motion.div>
        )}

        {/* Push Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
        >
          <button
            onClick={handleTogglePush}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isEnabled ? "bg-emerald-50" : "bg-gray-100"
            }`}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-[#1B2E4B] animate-spin" />
              ) : isEnabled ? (
                <BellRing className="w-4 h-4 text-emerald-600" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 text-sm font-semibold">
                Push Notifications
              </p>
              <p className="text-gray-400 text-xs">
                {!isSupported
                  ? "Not supported in this browser"
                  : permissionStatus === "denied"
                  ? "Blocked — enable in browser settings"
                  : isEnabled
                  ? "Receiving loan & payment alerts"
                  : "Tap to enable alerts"
                }
              </p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${
              isEnabled ? "bg-emerald-500" : "bg-gray-200"
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                isEnabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`} />
            </div>
          </button>

          {isEnabled && (
            <>
              <div className="h-px bg-gray-100 mx-4" />
              <div className="px-4 py-3 space-y-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">
                  You'll receive alerts for
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { emoji: "💸", label: "Loan requests" },
                    { emoji: "✅", label: "Loan accepted" },
                    { emoji: "❌", label: "Loan declined" },
                    { emoji: "💳", label: "Payments registered" },
                    { emoji: "✅", label: "Payments confirmed" },
                    { emoji: "⏰", label: "Upcoming reminders" },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5"
                    >
                      <span>{item.emoji}</span>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Payment Reminder Settings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Master toggle */}
          <button
            onClick={() => {
              const newEnabled = !reminderPreferences.enabled;
              updateReminderPreferences({ enabled: newEnabled });
              toast.success(
                newEnabled ? "Payment reminders enabled" : "Payment reminders disabled"
              );
            }}
            className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              reminderPreferences.enabled ? "bg-amber-50" : "bg-gray-100"
            }`}>
              <Clock className={`w-4 h-4 ${
                reminderPreferences.enabled ? "text-amber-600" : "text-gray-400"
              }`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 text-sm font-semibold">
                Payment Reminders
              </p>
              <p className="text-gray-400 text-xs">
                {reminderPreferences.enabled
                  ? "Automatic reminders for upcoming payments"
                  : "Tap to enable payment reminders"
                }
              </p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${
              reminderPreferences.enabled ? "bg-amber-500" : "bg-gray-200"
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                reminderPreferences.enabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`} />
            </div>
          </button>

          {/* Granular reminder toggles */}
          <AnimatePresence>
            {reminderPreferences.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="h-px bg-gray-100 mx-4" />
                <div className="px-4 py-3 space-y-1">
                  <p className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider mb-2">
                    Reminder Schedule
                  </p>

                  {/* 1 day before */}
                  <button
                    onClick={() =>
                      updateReminderPreferences({ dayBefore: !reminderPreferences.dayBefore })
                    }
                    className="flex items-center gap-3 w-full py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reminderPreferences.dayBefore ? "bg-emerald-50" : "bg-gray-50"
                    }`}>
                      <CalendarDays className={`w-3.5 h-3.5 ${
                        reminderPreferences.dayBefore ? "text-emerald-600" : "text-gray-300"
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-800 text-xs font-semibold">1 Day Before Due</p>
                      <p className="text-gray-400 text-[10px]">
                        "Payment due tomorrow for your LoanMate loan."
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${
                      reminderPreferences.dayBefore ? "bg-emerald-500" : "bg-gray-200"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        reminderPreferences.dayBefore ? "translate-x-[18px]" : "translate-x-0.5"
                      }`} />
                    </div>
                  </button>

                  {/* On due date */}
                  <button
                    onClick={() =>
                      updateReminderPreferences({ dueDay: !reminderPreferences.dueDay })
                    }
                    className="flex items-center gap-3 w-full py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reminderPreferences.dueDay ? "bg-blue-50" : "bg-gray-50"
                    }`}>
                      <Clock className={`w-3.5 h-3.5 ${
                        reminderPreferences.dueDay ? "text-blue-600" : "text-gray-300"
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-800 text-xs font-semibold">On Due Date</p>
                      <p className="text-gray-400 text-[10px]">
                        "Payment is due today."
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${
                      reminderPreferences.dueDay ? "bg-blue-500" : "bg-gray-200"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        reminderPreferences.dueDay ? "translate-x-[18px]" : "translate-x-0.5"
                      }`} />
                    </div>
                  </button>

                  {/* 2 days overdue */}
                  <button
                    onClick={() =>
                      updateReminderPreferences({ overdue: !reminderPreferences.overdue })
                    }
                    className="flex items-center gap-3 w-full py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reminderPreferences.overdue ? "bg-red-50" : "bg-gray-50"
                    }`}>
                      <AlertTriangle className={`w-3.5 h-3.5 ${
                        reminderPreferences.overdue ? "text-red-500" : "text-gray-300"
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-800 text-xs font-semibold">2 Days Overdue</p>
                      <p className="text-gray-400 text-[10px]">
                        "Payment overdue — not yet confirmed."
                      </p>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${
                      reminderPreferences.overdue ? "bg-red-500" : "bg-gray-200"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        reminderPreferences.overdue ? "translate-x-[18px]" : "translate-x-0.5"
                      }`} />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Other Settings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
        >
          {settings.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.label}>
                <button className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-gray-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-gray-900 text-sm font-semibold">{s.label}</p>
                    <p className="text-gray-400 text-xs">{s.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                {idx < settings.length - 1 && <div className="h-px bg-gray-100 mx-4" />}
              </div>
            );
          })}
        </motion.div>

        {/* Security Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setShowSecurityLog(!showSecurityLog)}
            className="w-full flex items-center gap-3 px-4 py-4"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 text-sm font-semibold">Security Activity</p>
              <p className="text-gray-400 text-[11px]">View recent security events</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showSecurityLog ? "rotate-90" : ""}`} />
          </button>

          <AnimatePresence>
            {showSecurityLog && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-100 px-4 py-3 max-h-64 overflow-y-auto space-y-2">
                  {(() => {
                    const events = securityService.getActivityLog(15);
                    if (events.length === 0) {
                      return (
                        <div className="flex flex-col items-center py-4">
                          <Activity className="w-5 h-5 text-gray-300 mb-2" />
                          <p className="text-gray-400 text-xs">No security events yet</p>
                        </div>
                      );
                    }
                    return events.map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs ${
                          event.severity === "critical"
                            ? "bg-red-50 border border-red-100"
                            : event.severity === "warning"
                            ? "bg-amber-50 border border-amber-100"
                            : "bg-gray-50 border border-gray-100"
                        }`}
                      >
                        <div className="mt-0.5">
                          {event.severity === "critical" ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                          ) : event.severity === "warning" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            event.severity === "critical" ? "text-red-700" :
                            event.severity === "warning" ? "text-amber-700" : "text-gray-700"
                          }`}>
                            {event.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-gray-500 line-clamp-2">{event.message}</p>
                          <p className="text-gray-400 mt-0.5">
                            {new Date(event.timestamp).toLocaleString("en-US", {
                              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={logout}
          className="w-full flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-red-500 font-semibold text-sm">
            Log Out
          </span>
        </motion.button>
      </div>
    </div>
  );
}
