import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, User as UserIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { User } from "@/types/loan";

export default function OnboardingScreen() {
  const { login } = useApp();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    const initials = name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const newUser: User = {
      id: "user_current",
      name: name.trim(),
      phone_number: "+1 (555) 234-5678",
      avatar: initials,
      created_at: new Date().toISOString(),
    };
    login(newUser);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* BG gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#00C9A7] opacity-[0.03] blur-3xl" />
      </div>

      {/* Header */}
      <div className="pt-16 pb-8 px-6 z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Create Your <span className="text-[#00C9A7]">Profile</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Let friends know who you are
          </p>
        </motion.div>
      </div>

      <div className="flex-1 px-6 z-10 flex flex-col gap-6">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-[#1A2B3C] border-2 border-[#00C9A7]/30 flex items-center justify-center">
              {name ? (
                <span className="text-3xl font-black text-[#00C9A7]" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {name
                    .trim()
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              ) : (
                <UserIcon className="w-10 h-10 text-white/20" />
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#00C9A7] flex items-center justify-center shadow-lg shadow-[#00C9A7]/30">
              <Camera className="w-4 h-4 text-[#0D1B2A]" />
            </button>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white placeholder-white/30 text-base font-medium focus:outline-none focus:border-[#00C9A7]/50 transition-colors"
              style={{ fontFamily: "'Manrope', sans-serif" }}
              autoFocus
            />
            {error && (
              <p className="text-[#FF6B6B] text-sm mt-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {error}
              </p>
            )}
          </div>

          {/* Phone (locked) */}
          <div>
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Phone Number
            </label>
            <div className="flex items-center gap-3 h-14 px-4 rounded-2xl bg-[#1A2B3C]/60 border border-white/5">
              <span className="text-white/40 text-base" style={{ fontFamily: "'Manrope', sans-serif" }}>
                +1 (555) 234-5678
              </span>
              <span className="ml-auto text-xs text-[#00C9A7] font-semibold uppercase tracking-wider bg-[#00C9A7]/10 px-2 py-1 rounded-full">
                Verified ✓
              </span>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-auto pb-8"
        >
          <button
            onClick={handleCreate}
            className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[#00C9A7]/20"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Create My Profile
          </button>
        </motion.div>
      </div>
    </div>
  );
}
