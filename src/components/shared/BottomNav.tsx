import { Home, CreditCard, Bell, User, BookUser } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";

type Tab = "dashboard" | "loans" | "contacts" | "notifications" | "profile";

export default function BottomNav() {
  const { currentScreen, navigate, getUnreadCount } = useApp();
  const unread = getUnreadCount();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "loans", label: "Loans", icon: CreditCard },
    { id: "contacts", label: "Contacts", icon: BookUser },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  const activeTab = (["dashboard", "loans", "contacts", "notifications", "profile"] as Tab[]).includes(
    currentScreen as Tab
  )
    ? (currentScreen as Tab)
    : "dashboard";

  return (
    <div className="flex items-center justify-around px-2 pb-2 pt-2 bg-white border-t border-gray-100">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className="relative flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all"
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-[#1B2E4B]" : "text-gray-400"
                }`}
              />
              {tab.id === "notifications" && unread > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center"
                >
                  <span className="text-[8px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                </motion.div>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold transition-colors ${
                isActive ? "text-[#1B2E4B]" : "text-gray-400"
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#1B2E4B]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
