import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Lock, ChevronRight, ExternalLink } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function TermsScreen() {
  const { acceptTerms } = useApp();
  const [tosChecked, setTosChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const canContinue = tosChecked && privacyChecked;

  return (
    <div className="relative flex flex-col h-full bg-[#0D1B2A] overflow-hidden">
      {/* Background mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,201,167,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative px-6 pt-14 pb-6">
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center text-center gap-3"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#00C9A7]/15 border border-[#00C9A7]/30 flex items-center justify-center mb-1">
            <ShieldCheck className="w-8 h-8 text-[#00C9A7]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Before You Continue
          </h1>
          <p className="text-white/50 text-sm font-medium leading-relaxed max-w-xs">
            Please read and accept the following before using LoanMate.
          </p>
        </motion.div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">

        {/* Disclaimer card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-2xl border border-[#00C9A7]/25 overflow-hidden"
          style={{ background: "rgba(26,43,60,0.85)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-[#00C9A7]/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-[#00C9A7]" />
            </div>
            <span className="text-white text-sm font-bold">Legal Disclaimer</span>
          </div>

          <div className="px-4 py-4 space-y-3">
            {[
              "LoanMate does not provide loans or financial services.",
              "LoanMate only provides tools to record agreements between individuals.",
              "Users are fully responsible for any financial agreements created using the platform.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] mt-[6px] flex-shrink-0" />
                <p className="text-white/75 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Important notice card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-2xl border border-[#FFB347]/25 px-4 py-3 flex items-start gap-3"
          style={{ background: "rgba(255,179,71,0.07)" }}
        >
          <Lock className="w-4 h-4 text-[#FFB347] mt-0.5 flex-shrink-0" />
          <p className="text-[#FFB347]/90 text-xs leading-relaxed">
            By continuing, you acknowledge that LoanMate is a record-keeping tool only.
            All financial agreements are strictly between you and the other party.
            LoanMate bears no legal responsibility for any disputes arising from agreements recorded on this platform.
          </p>
        </motion.div>

        {/* Checkboxes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="space-y-3"
        >
          {/* ToS */}
          <button
            onClick={() => setTosChecked((v) => !v)}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
            style={{
              background: tosChecked
                ? "rgba(0,201,167,0.1)"
                : "rgba(26,43,60,0.85)",
              border: `1px solid ${tosChecked ? "rgba(0,201,167,0.4)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: tosChecked ? "#00C9A7" : "transparent",
                border: `2px solid ${tosChecked ? "#00C9A7" : "rgba(255,255,255,0.25)"}`,
              }}
            >
              {tosChecked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <span className="text-white/90 text-sm font-medium">I accept the </span>
              <span className="text-[#00C9A7] text-sm font-semibold">Terms of Service</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-white/30" />
          </button>

          {/* Privacy */}
          <button
            onClick={() => setPrivacyChecked((v) => !v)}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
            style={{
              background: privacyChecked
                ? "rgba(0,201,167,0.1)"
                : "rgba(26,43,60,0.85)",
              border: `1px solid ${privacyChecked ? "rgba(0,201,167,0.4)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: privacyChecked ? "#00C9A7" : "transparent",
                border: `2px solid ${privacyChecked ? "#00C9A7" : "rgba(255,255,255,0.25)"}`,
              }}
            >
              {privacyChecked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <span className="text-white/90 text-sm font-medium">I accept the </span>
              <span className="text-[#00C9A7] text-sm font-semibold">Privacy Policy</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-white/30" />
          </button>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="px-6 pb-10 pt-4"
      >
        <button
          onClick={() => canContinue && acceptTerms()}
          disabled={!canContinue}
          className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: canContinue
              ? "linear-gradient(135deg, #00C9A7 0%, #00b394 100%)"
              : "rgba(255,255,255,0.06)",
            color: canContinue ? "#0D1B2A" : "rgba(255,255,255,0.25)",
            boxShadow: canContinue ? "0 8px 24px rgba(0,201,167,0.3)" : "none",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          I Agree & Continue
          <ChevronRight className="w-5 h-5" />
        </button>

        {!canContinue && (
          <p className="text-center text-white/30 text-xs mt-3">
            Please accept both agreements to continue
          </p>
        )}
      </motion.div>
    </div>
  );
}
