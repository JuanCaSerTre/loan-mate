import { motion } from "framer-motion";
import { LogOut, Bell, ChevronRight, Shield, HelpCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AvatarBadge from "@/components/shared/AvatarBadge";

export default function ProfileScreen() {
  const { currentUser, loans, logout } = useApp();

  if (!currentUser) return null;

  const loansGiven = loans.filter((l) => l.lender_id === currentUser.id);
  const loansReceived = loans.filter((l) => l.borrower_id === currentUser.id);
  const completedLoans = loans.filter(
    (l) =>
      (l.lender_id === currentUser.id || l.borrower_id === currentUser.id) &&
      l.status === "completed"
  );

  const stats = [
    { label: "Loans Given", value: loansGiven.length, color: "text-[#00C9A7]" },
    { label: "Loans Received", value: loansReceived.length, color: "text-[#FFB347]" },
    { label: "Completed", value: completedLoans.length, color: "text-white" },
  ];

  const settings = [
    { icon: Bell, label: "Notifications", desc: "Push & in-app alerts" },
    { icon: Shield, label: "Privacy & Security", desc: "Data & account settings" },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQ & contact us" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Header */}
      <div className="relative px-5 pt-12 pb-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#00C9A7] opacity-[0.04] blur-3xl" />
        </div>
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 z-10 relative"
        >
          <AvatarBadge
            initials={currentUser.avatar || currentUser.name.slice(0, 2)}
            size="lg"
          />
          <div>
            <h2 className="text-white text-xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>
              {currentUser.name}
            </h2>
            <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {currentUser.phone_number}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
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
              className="bg-[#1A2B3C] border border-white/5 rounded-2xl p-3 text-center"
            >
              <p className={`text-2xl font-black ${stat.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                {stat.value}
              </p>
              <p className="text-white/30 text-[10px] mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
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
          className="bg-[#1A2B3C] border border-white/5 rounded-3xl p-4 space-y-3"
        >
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Account
          </h3>
          <div className="flex justify-between">
            <span className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Member since</span>
            <span className="text-white text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {new Date(currentUser.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>Verified phone</span>
            <span className="text-[#00C9A7] text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
              ✓ Verified
            </span>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#1A2B3C] border border-white/5 rounded-3xl overflow-hidden"
        >
          {settings.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.label}>
                <button className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-white/40" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>{s.label}</p>
                    <p className="text-white/30 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>{s.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </button>
                {idx < settings.length - 1 && <div className="h-px bg-white/5 mx-4" />}
              </div>
            );
          })}
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={logout}
          className="w-full flex items-center gap-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-[#FF6B6B]" />
          </div>
          <span className="text-[#FF6B6B] font-semibold text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Log Out
          </span>
        </motion.button>
      </div>
    </div>
  );
}
