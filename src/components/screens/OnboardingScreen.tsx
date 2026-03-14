import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, User as UserIcon, WifiOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { trackUserSignup } from "@/services/analyticsService";
import { createUser, getUserByPhone } from "@/services/api/supabaseDataService";

export default function OnboardingScreen() {
  const { login, navigate } = useApp();
  const [name, setName] = useState("");
  const verifiedPhone = sessionStorage.getItem("juca_verified_phone") || "";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!verifiedPhone) {
      setError("Phone number missing. Please go back and re-enter.");
      return;
    }

    if (!navigator.onLine) {
      setError("No internet connection. Check your network and try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    const initials = name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    try {
      // Check if user already exists to avoid duplicates
      const existing = await getUserByPhone(verifiedPhone);
      if (existing) {
        sessionStorage.removeItem("juca_verified_phone");
        await login(existing);
        setIsLoading(false);
        return;
      }

      // Save the user to Supabase
      const savedUser = await createUser({
        name: name.trim(),
        phone_number: verifiedPhone,
        avatar: initials,
      });

      setIsLoading(false);

      if (!savedUser) {
        setRetryCount((prev) => prev + 1);
        setError("Failed to create profile. Please try again.");
        return;
      }

      sessionStorage.removeItem("juca_verified_phone");
      trackUserSignup(savedUser.id);
      login(savedUser);
    } catch (err) {
      console.error("[OnboardingScreen] error:", err);
      setRetryCount((prev) => prev + 1);
      setIsLoading(false);
      if (!navigator.onLine) {
        setError("No internet connection. Please check your network.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-[#1B2E4B] px-6 pt-16 pb-10 rounded-b-[32px]">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate("login")}
            className="text-white/50 text-sm mb-4 flex items-center gap-1 active:text-white/70 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-extrabold text-white">
            Create Your Profile
          </h1>
          <p className="text-white/60 mt-2 text-sm font-medium">
            Let friends know who you are
          </p>
        </motion.div>
      </div>

      <div className="flex-1 px-6 pt-6 z-10 flex flex-col gap-6">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {name ? (
                <span className="text-2xl font-extrabold text-[#1B2E4B]">
                  {name
                    .trim()
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              ) : (
                <UserIcon className="w-10 h-10 text-gray-300" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1B2E4B] flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4 text-white" />
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
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={`w-full h-14 px-4 rounded-2xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-base font-medium focus:outline-none transition-all ${
                error
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-200 focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20"
              }`}
              autoFocus
            />
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5 mt-2"
                >
                  <span className="text-sm">⚠️</span>
                  <p className="text-red-500 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Phone (locked) */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Phone Number
            </label>
            <div className="flex items-center gap-3 h-14 px-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 text-base">
                {verifiedPhone || "—"}
              </span>
              <span className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
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
          {retryCount > 1 && (
            <p className="text-center text-gray-400 text-xs mb-3">
              Having trouble? Make sure you're connected to the internet.
            </p>
          )}
          <button
            onClick={handleCreate}
            disabled={isLoading || !name.trim()}
            className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base active:scale-[0.98] transition-transform shadow-lg shadow-[#1B2E4B]/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                {retryCount > 0 ? "Retrying…" : "Creating Profile…"}
              </>
            ) : "Create My Profile"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
