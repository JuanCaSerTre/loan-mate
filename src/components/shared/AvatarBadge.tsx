interface AvatarBadgeProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
};

const colorMap: Record<string, string> = {
  A: "from-teal-500 to-cyan-600",
  B: "from-purple-500 to-indigo-600",
  C: "from-orange-500 to-red-500",
  D: "from-pink-500 to-rose-600",
  E: "from-green-500 to-emerald-600",
  F: "from-yellow-500 to-amber-600",
  G: "from-blue-500 to-sky-600",
  H: "from-violet-500 to-purple-600",
  J: "from-teal-400 to-green-500",
  K: "from-red-400 to-orange-500",
  L: "from-indigo-400 to-blue-500",
  M: "from-pink-400 to-purple-500",
  N: "from-cyan-400 to-teal-500",
  O: "from-amber-400 to-yellow-500",
  P: "from-emerald-400 to-green-500",
  Q: "from-fuchsia-400 to-pink-500",
  R: "from-rose-400 to-red-500",
  S: "from-sky-400 to-blue-500",
  T: "from-teal-300 to-cyan-400",
};

function getGradient(initials: string): string {
  const first = initials[0]?.toUpperCase() || "A";
  return colorMap[first] || "from-teal-500 to-cyan-600";
}

export default function AvatarBadge({ initials, size = "md", className = "" }: AvatarBadgeProps) {
  const gradient = getGradient(initials);
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}
    >
      <span
        className="font-bold text-white"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {initials.slice(0, 2)}
      </span>
    </div>
  );
}
