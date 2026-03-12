import { useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";

export default function SplashScreen() {
  const { navigate } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("login");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden bg-[#0D1B2A]">
      {/* Radial mesh gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00C9A7] opacity-5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#00C9A7] opacity-[0.03] blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00C9A7] opacity-[0.04] blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 z-10"
      >
        {/* Logo Mark */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-3xl bg-[#1A2B3C] border border-[#00C9A7]/30 flex items-center justify-center shadow-2xl shadow-[#00C9A7]/10">
            <div className="relative">
              {/* Coin */}
              <div className="w-10 h-10 rounded-full border-[3px] border-[#00C9A7] flex items-center justify-center">
                <span className="text-[#00C9A7] font-bold text-lg font-mono">$</span>
              </div>
              {/* Handshake indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00C9A7] flex items-center justify-center">
                <span className="text-[8px]">🤝</span>
              </div>
            </div>
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-3xl border border-[#00C9A7]/20 blur-sm" />
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Loan<span className="text-[#00C9A7]">Mate</span>
          </h1>
          <p className="text-[#00C9A7]/70 text-sm mt-2 font-medium tracking-widest uppercase" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Loans between friends, made honest.
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-2 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#00C9A7]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
