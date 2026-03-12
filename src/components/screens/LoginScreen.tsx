import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { mockUsers } from "@/data/mockData";

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
    if (code === VALID_OTP) {
      // Check if returning or new user
      const fullPhone = countryCode.code + " " + phone;
      const existingUser = mockUsers.find(
        (u) => u.phone_number.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))
      );
      if (existingUser) {
        login(existingUser);
      } else {
        navigate("onboarding");
      }
    } else {
      setIsShaking(true);
      setError("Invalid verification code. Try 123456");
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
    <div className="relative flex flex-col h-full overflow-hidden bg-[#0D1B2A]">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#00C9A7] opacity-[0.04] blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-[#00C9A7] opacity-[0.04] blur-3xl" />
      </div>

      {/* Header */}
      <div className="pt-16 pb-8 px-6 z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Loan<span className="text-[#00C9A7]">Mate</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {step === "phone" ? "Enter your phone number to get started" : "Enter the 6-digit code we sent"}
          </p>
        </motion.div>
      </div>

      <div className="flex-1 px-6 z-10">
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
                    className="flex items-center gap-2 h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white text-sm font-semibold min-w-[90px]"
                  >
                    <span>{countryCode.flag}</span>
                    <span>{countryCode.code}</span>
                    <ChevronDown className="w-3 h-3 text-white/40" />
                  </button>
                  <AnimatePresence>
                    {showCountryPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-16 left-0 bg-[#1A2B3C] border border-white/10 rounded-2xl overflow-hidden z-50 w-40 shadow-2xl"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code}
                            onClick={() => {
                              setCountryCode(c);
                              setShowCountryPicker(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                          >
                            <span>{c.flag}</span>
                            <span className="text-white/60">{c.code}</span>
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
                  className="flex-1 h-14 px-4 rounded-2xl bg-[#1A2B3C] border border-white/10 text-white placeholder-white/30 text-base font-medium focus:outline-none focus:border-[#00C9A7]/50 transition-colors"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
              </div>

              {error && (
                <p className="text-[#FF6B6B] text-sm font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSendCode}
                className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base active:scale-[0.98] transition-transform mt-2"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Send Code
              </button>

              <p className="text-center text-white/30 text-xs mt-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                By continuing, you agree to our Terms of Service and Privacy Policy
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
                <p className="text-white/60 text-sm mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Sent to {countryCode.code} {phone}
                </p>
                <button
                  onClick={() => setStep("phone")}
                  className="text-[#00C9A7] text-sm font-semibold"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
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
                    className={`w-12 h-14 rounded-xl text-center text-xl font-bold text-white bg-[#1A2B3C] border transition-all focus:outline-none ${
                      isShaking
                        ? "border-[#FF6B6B] shadow-[0_0_12px_rgba(255,107,107,0.4)]"
                        : digit
                        ? "border-[#00C9A7] shadow-[0_0_8px_rgba(0,201,167,0.3)]"
                        : "border-white/10 focus:border-[#00C9A7]/50"
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                ))}
              </motion.div>

              {error && (
                <p className="text-[#FF6B6B] text-sm font-medium text-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {error}
                </p>
              )}

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-white/40 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Resend code in{" "}
                    <span className="text-[#00C9A7] font-mono">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-[#00C9A7] text-sm font-semibold"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                onClick={() => verifyOtp(otp.join(""))}
                disabled={otp.some((d) => !d)}
                className="w-full h-14 rounded-2xl bg-[#00C9A7] text-[#0D1B2A] font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Verify Code
              </button>

              <p className="text-center text-white/30 text-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Hint: use <span className="font-mono text-[#00C9A7]/60">123456</span> for demo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
