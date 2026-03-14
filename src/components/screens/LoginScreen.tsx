import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getUserByPhone } from "@/services/api/supabaseDataService";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+91", flag: "🇮🇳", name: "IN" },
  { code: "+52", flag: "🇲🇽", name: "MX" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
];

export default function LoginScreen() {
  const { login, navigate } = useApp();
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setIsLoading(true);

    const fullPhone = countryCode.code + phone.replace(/\D/g, "");
    sessionStorage.setItem("juca_verified_phone", fullPhone);

    try {
      // Check if user already exists in Supabase
      const existingUser = await getUserByPhone(fullPhone);

      if (existingUser) {
        // Returning user → log in with real data
        await login(existingUser);
      } else {
        // New user → go to onboarding to create profile
        navigate("onboarding");
      }
    } catch (err) {
      console.error("[LoginScreen] error:", err);
      setError("Something went wrong. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-white">
      {/* Header with deep blue top section */}
      <div className="bg-[#1B2E4B] px-6 pt-16 pb-10 rounded-b-[32px]">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-white">
            JU<span className="text-emerald-400">CA</span>
          </h1>
          <p className="text-white/60 mt-2 text-sm font-medium">
            Enter your phone number to get started
          </p>
        </motion.div>
      </div>
      <div className="flex-1 px-6 pt-8 z-10">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          <div className="flex gap-2">
            {/* Country code picker */}
            <div className="relative">
              <button
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="flex items-center gap-2 h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold min-w-[90px]"
              >
                <span>{countryCode.flag}</span>
                <span>{countryCode.code}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <AnimatePresence>
                {showCountryPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-16 left-0 bg-white border border-gray-200 rounded-2xl overflow-hidden z-50 w-44 shadow-xl"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCountryCode(c);
                          setShowCountryPicker(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span>{c.flag}</span>
                        <span className="text-gray-400">{c.code}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Phone input */}
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className="flex-1 h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-base font-medium focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base active:scale-[0.98] transition-transform mt-2 shadow-lg shadow-[#1B2E4B]/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Logging in…
              </>
            ) : "Continue"}
          </button>

          <p className="text-center text-gray-400 text-xs mt-2">
            By continuing, you agree to our Terms of Service and Privacy
            Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
