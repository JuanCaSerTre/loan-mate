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
  loan_request: { icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
  loan_accepted: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  loan_declined: { icon: X, color: "text-red-500", bg: "bg-red-50" },
  payment_registered: { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
  payment_confirmed: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
  payment_rejected: { icon: X, color: "text-red-500", bg: "bg-red-50" },
  payment_reminder: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
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

  const unreadNotifs = notifications.filter((n) => !n.read);
  const readNotifs = notifications.filter((n) => n.read);
  const unreadCount = unreadNotifs.length;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-[#1B2E4B] flex items-center justify-center"
              >
                <span className="text-white text-[10px] font-bold">{unreadCount}</span>
              </motion.div>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-[#1B2E4B] text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
            >
              Mark all read
            </button>
          )}
        </motion.div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-semibold">All caught up!</p>
            <p className="text-gray-400 text-xs">No notifications yet</p>
          </div>
        ) : (
          <>
            {/* Unread section */}
            {unreadNotifs.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-1">New</p>
                {unreadNotifs.map((notif, idx) => {
                  const config = notifIcons[notif.type];
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => handleTap(notif)}
                      className="w-full flex items-start gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] bg-white border border-[#1B2E4B]/10 shadow-sm"
                    >
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {notif.title}
                          </p>
                          <div className="w-2 h-2 rounded-full bg-[#1B2E4B] flex-shrink-0" />
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-gray-300 text-[10px] mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Read section */}
            {readNotifs.length > 0 && (
              <div className="space-y-2">
                {unreadNotifs.length > 0 && (
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-1 pt-2">Earlier</p>
                )}
                {readNotifs.map((notif, idx) => {
                  const config = notifIcons[notif.type];
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleTap(notif)}
                      className="w-full flex items-start gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] bg-white/60 border border-gray-50"
                    >
                      <div className={`w-10 h-10 rounded-full ${config.bg} opacity-60 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">
                          {notif.title}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-gray-300 text-[10px] mt-1">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
