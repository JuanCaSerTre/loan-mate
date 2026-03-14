import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, WifiOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getUserByPhone } from "@/services/api/supabaseDataService";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+91", flag: "🇮🇳", name: "IN" },
  { code: "+52", flag: "🇲🇽", name: "MX" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
  { code: "+55", flag: "🇧🇷", name: "BR" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+34", flag: "🇪🇸", name: "ES" },
];

type ErrorType = "validation" | "network" | "server" | null;

export default function LoginScreen() {
  const { login, navigate } = useApp();
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const formatPhone = (value: string) => {
    return value.replace(/[^0-9 \-]/g, "");
  };

  const handleContinue = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 7) {
      setError("Please enter a valid phone number (min. 7 digits)");
      setErrorType("validation");
      return;
    }
    if (cleanPhone.length > 15) {
      setError("Phone number is too long");
      setErrorType("validation");
      return;
    }

    if (!navigator.onLine) {
      setError("No internet connection. Check your network and try again.");
      setErrorType("network");
      return;
    }

    setError("");
    setErrorType(null);
    setIsLoading(true);

    const fullPhone = countryCode.code + cleanPhone;
    sessionStorage.setItem("juca_verified_phone", fullPhone);

    try {
      const existingUser = await getUserByPhone(fullPhone);

      if (existingUser) {
        await login(existingUser);
      } else {
        navigate("onboarding");
      }
    } catch (err: unknown) {
      console.error("[LoginScreen] error:", err);
      setRetryCount((prev) => prev + 1);

      if (!navigator.onLine || (err instanceof TypeError && err.message.includes("fetch"))) {
        setError("Connection failed. Please check your internet and try again.");
        setErrorType("network");
      } else {
        setError("Something went wrong. Please try again.");
        setErrorType("server");
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
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
            Loans between friends, made honest.
          </p>
        </motion.div>
      </div>

      {/* Offline banner */}
      <AnimatePresence>
        {!navigator.onLine && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 text-xs font-medium">
              No internet connection
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 px-6 pt-8 z-10">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          <div>
            <p className="text-gray-900 font-bold text-lg mb-1">Enter your phone number</p>
            <p className="text-gray-400 text-sm">
              {retryCount === 0
                ? "We'll check if you have an account"
                : "One more try — connecting to our servers"}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Country code picker */}
            <div className="relative">
              <button
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="flex items-center gap-2 h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold min-w-[90px] active:scale-95 transition-transform"
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
                    className="absolute top-16 left-0 bg-white border border-gray-200 rounded-2xl overflow-hidden z-50 w-44 shadow-xl max-h-60 overflow-y-auto"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCountryCode(c);
                          setShowCountryPicker(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                          c.code === countryCode.code
                            ? "bg-[#1B2E4B] text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span className={c.code === countryCode.code ? "text-white/70" : "text-gray-400"}>{c.code}</span>
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
                setPhone(formatPhone(e.target.value));
                if (error) { setError(""); setErrorType(null); }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className={`flex-1 h-14 px-4 rounded-2xl bg-gray-50 border text-gray-900 placeholder-gray-400 text-base font-medium focus:outline-none transition-all ${
                errorType === "validation"
                  ? "border-red-400 bg-red-50/30"
                  : errorType === "network"
                  ? "border-amber-400 bg-amber-50/30"
                  : "border-gray-200 focus:border-[#1B2E4B] focus:ring-2 focus:ring-[#1B2E4B]/10 focus:bg-white"
              }`}
              autoComplete="tel"
            />
          </div>

          {/* Error display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                  errorType === "network"
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {errorType === "network" ? (
                  <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <span className="text-base flex-shrink-0">⚠️</span>
                )}
                <p className={`text-sm font-medium ${
                  errorType === "network" ? "text-amber-700" : "text-red-600"
                }`}>
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleContinue}
            disabled={isLoading || phone.replace(/\D/g, "").length < 7}
            className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base active:scale-[0.98] transition-transform mt-2 shadow-lg shadow-[#1B2E4B]/20 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                {retryCount > 0 ? "Retrying…" : "Checking…"}
              </>
            ) : retryCount > 0 ? "Try Again →" : "Continue →"}
          </button>

          {retryCount > 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 text-xs"
            >
              Having trouble? Make sure you have a stable connection.
            </motion.p>
          )}

          <p className="text-center text-gray-400 text-xs mt-2">
            By continuing, you agree to our{" "}
            <span className="text-[#1B2E4B] font-semibold">Terms of Service</span>{" "}
            and{" "}
            <span className="text-[#1B2E4B] font-semibold">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
