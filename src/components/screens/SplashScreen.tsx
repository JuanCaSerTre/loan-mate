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
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden bg-[#1B2E4B]">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-400 opacity-10 blur-[100px]" />
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
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <div className="relative">
              {/* Coin */}
              <div className="w-10 h-10 rounded-full bg-[#1B2E4B] flex items-center justify-center">
                <span className="text-white font-bold text-lg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>$</span>
              </div>
              {/* Handshake */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-[8px]">🤝</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Loan<span className="text-emerald-400">Mate</span>
          </h1>
          <p className="text-white/50 text-sm mt-2 font-medium">
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
              className="w-2 h-2 rounded-full bg-white/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
