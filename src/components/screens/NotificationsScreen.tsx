import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  X,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Notification } from "@/types/loan";

const notifIcons = {
  loan_request: { icon: CreditCard, color: "text-[#FFB347]", bg: "bg-[#FFB347]/10" },
  loan_accepted: { icon: CheckCircle, color: "text-[#00C9A7]", bg: "bg-[#00C9A7]/10" },
  loan_declined: { icon: X, color: "text-[#FF6B6B]", bg: "bg-[#FF6B6B]/10" },
  payment_registered: { icon: CreditCard, color: "text-[#00C9A7]", bg: "bg-[#00C9A7]/10" },
  payment_confirmed: { icon: Check, color: "text-[#00C9A7]", bg: "bg-[#00C9A7]/10" },
  payment_rejected: { icon: X, color: "text-[#FF6B6B]", bg: "bg-[#FF6B6B]/10" },
  payment_reminder: { icon: Clock, color: "text-[#FFB347]", bg: "bg-[#FFB347]/10" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead, selectLoan, navigate } = useApp();

  const handleTap = (notif: Notification) => {
    markNotificationRead(notif.id);
    if (notif.loan_id) {
      selectLoan(notif.loan_id);
      if (notif.type === "loan_request") {
        navigate("loan-request");
      } else if (notif.type === "payment_registered" || notif.type === "payment_confirmed" || notif.type === "payment_rejected") {
        navigate("loan-details");
      } else {
        navigate("loan-details");
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-white/40 text-sm mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-[#00C9A7] text-xs font-semibold px-3 py-2 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Mark all read
            </button>
          )}
        </motion.div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <div className="w-16 h-16 rounded-3xl bg-[#1A2B3C] border border-white/5 flex items-center justify-center">
              <Bell className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            const config = notifIcons[notif.type];
            const Icon = config.icon;
            return (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => handleTap(notif)}
                className={`w-full flex items-start gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                  !notif.read
                    ? "bg-[#1A2B3C] border border-white/10"
                    : "bg-[#1A2B3C]/40 border border-white/5"
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <p
                      className={`text-sm font-semibold truncate ${!notif.read ? "text-white" : "text-white/60"}`}
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-[#00C9A7] flex-shrink-0" />
                    )}
                  </div>
                  <p
                    className="text-white/40 text-xs mt-0.5 line-clamp-2"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {notif.message}
                  </p>
                  <p
                    className="text-white/20 text-[10px] mt-1"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
