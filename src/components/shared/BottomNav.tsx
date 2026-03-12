import { Home, CreditCard, Bell, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";

type Tab = "dashboard" | "loans" | "notifications" | "profile";

export default function BottomNav() {
  const { currentScreen, navigate, getUnreadCount } = useApp();
  const unread = getUnreadCount();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "loans", label: "Loans", icon: CreditCard },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  const activeTab = (["dashboard", "loans", "notifications", "profile"] as Tab[]).includes(
    currentScreen as Tab
  )
    ? (currentScreen as Tab)
    : "dashboard";

  return (
    <div className="flex items-center justify-around px-2 pb-2 pt-2 bg-[#0D1B2A] border-t border-white/5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
          >
            <div className="relative">
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? "text-[#00C9A7]" : "text-white/30"
                }`}
              />
              {tab.id === "notifications" && unread > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B6B] border-2 border-[#0D1B2A] flex items-center justify-center"
                >
                  <span className="text-[8px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                </motion.div>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold transition-colors ${
                isActive ? "text-[#00C9A7]" : "text-white/30"
              }`}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00C9A7]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
