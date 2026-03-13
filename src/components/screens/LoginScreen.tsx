import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { mockUsers } from "@/data/mockData";
import { securityService } from "@/services/securityService";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+91", flag: "🇮🇳", name: "IN" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
];

const VALID_OTP = "123456";

export default function LoginScreen() {
  const { navigate, login } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startResendTimer = () => {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendCode = () => {
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setStep("otp");
    startResendTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    setError("");
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      setTimeout(() => verifyOtp(newOtp.join("")), 100);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const verifyOtp = (code: string) => {
    const fullPhone = countryCode.code + phone;

    // Check OTP lockout
    const otpCheck = securityService.checkOTPAttempt(fullPhone);
    if (!otpCheck.allowed) {
      setError(
        `Too many failed attempts. Try again in ${otpCheck.lockoutUntil}`,
      );
      setOtp(["", "", "", "", "", ""]);
      return;
    }

    if (code === VALID_OTP) {
      // Clear OTP attempts on success
      securityService.clearOTPAttempts(fullPhone);

      // Check if returning or new user
      const existingUser = mockUsers.find((u) =>
        u.phone_number.replace(/\D/g, "").includes(phone.replace(/\D/g, "")),
      );
      if (existingUser) {
        login(existingUser);
      } else {
        navigate("onboarding");
      }
    } else {
      // Record failed attempt
      securityService.recordFailedOTP(fullPhone);

      const updatedCheck = securityService.checkOTPAttempt(fullPhone);

      setIsShaking(true);
      if (!updatedCheck.allowed) {
        setError(`Account locked. Try again in ${updatedCheck.lockoutUntil}`);
      } else {
        setError(
          `Invalid verification code. ${updatedCheck.remainingAttempts} attempt${updatedCheck.remainingAttempts !== 1 ? "s" : ""} remaining.`,
        );
      }
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        setIsShaking(false);
        otpRefs.current[0]?.focus();
      }, 600);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    startResendTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
            Loan<span className="text-emerald-400">Mate</span>
          </h1>
          <p className="text-white/60 mt-2 text-sm font-medium">
            {step === "phone"
              ? "Enter your phone number to get started"
              : "Enter the 6-digit code we sent"}
          </p>
        </motion.div>
      </div>
      <div className="flex-1 px-6 pt-8 z-10">
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  className="flex-1 h-14 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-base font-medium focus:outline-none focus:border-[#1B2E4B] focus:ring-1 focus:ring-[#1B2E4B]/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}

              <button
                onClick={handleSendCode}
                className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base active:scale-[0.98] transition-transform mt-2 shadow-lg shadow-[#1B2E4B]/20"
              >
                Send Code
              </button>

              <p className="text-center text-gray-400 text-xs mt-4">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="text-gray-500 text-sm mb-1">
                  Sent to {countryCode.code} {phone}
                </p>
                <button
                  onClick={() => setStep("phone")}
                  className="text-[#1B2E4B] text-sm font-semibold"
                >
                  Change number
                </button>
              </div>

              {/* OTP inputs */}
              <motion.div
                animate={isShaking ? { x: [-8, 8, -8, 8, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex gap-3 justify-center"
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 rounded-xl text-center text-xl font-bold text-gray-900 bg-gray-50 border transition-all focus:outline-none ${
                      isShaking
                        ? "border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                        : digit
                          ? "border-[#1B2E4B] shadow-sm"
                          : "border-gray-200 focus:border-[#1B2E4B]"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                ))}
              </motion.div>

              {error && (
                <p className="text-red-500 text-sm font-medium text-center">
                  {error}
                </p>
              )}

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-gray-400 text-sm">
                    Resend code in{" "}
                    <span className="text-[#1B2E4B] font-mono font-semibold">
                      {resendTimer}s
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-[#1B2E4B] text-sm font-semibold"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                onClick={() => verifyOtp(otp.join(""))}
                disabled={otp.some((d) => !d)}
                className="w-full h-14 rounded-2xl bg-[#1B2E4B] text-white font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-[#1B2E4B]/20"
              >
                Verify Code
              </button>

              <p className="text-center text-gray-400 text-xs">
                Hint: use{" "}
                <span className="font-mono text-[#1B2E4B]/60">123456</span> for
                demo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <h1 className="text-4xl font-extrabold tracking-tight h-[40px]  text-black">
          Header 1
        </h1>
      </div>
    </div>
  );
}
