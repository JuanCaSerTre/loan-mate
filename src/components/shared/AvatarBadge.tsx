interface AvatarBadgeProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-sm",
};

const colorMap: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-blue-100", text: "text-blue-700" },
  B: { bg: "bg-purple-100", text: "text-purple-700" },
  C: { bg: "bg-orange-100", text: "text-orange-700" },
  D: { bg: "bg-pink-100", text: "text-pink-700" },
  E: { bg: "bg-emerald-100", text: "text-emerald-700" },
  F: { bg: "bg-amber-100", text: "text-amber-700" },
  G: { bg: "bg-sky-100", text: "text-sky-700" },
  H: { bg: "bg-violet-100", text: "text-violet-700" },
  J: { bg: "bg-teal-100", text: "text-teal-700" },
  K: { bg: "bg-red-100", text: "text-red-700" },
  L: { bg: "bg-indigo-100", text: "text-indigo-700" },
  M: { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  N: { bg: "bg-cyan-100", text: "text-cyan-700" },
  O: { bg: "bg-lime-100", text: "text-lime-700" },
  P: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Q: { bg: "bg-rose-100", text: "text-rose-700" },
  R: { bg: "bg-red-100", text: "text-red-600" },
  S: { bg: "bg-sky-100", text: "text-sky-700" },
  T: { bg: "bg-teal-100", text: "text-teal-700" },
};

function getColors(initials: string) {
  const first = initials[0]?.toUpperCase() || "A";
  return colorMap[first] || { bg: "bg-blue-100", text: "text-blue-700" };
}

export default function AvatarBadge({ initials, size = "md", className = "" }: AvatarBadgeProps) {
  const colors = getColors(initials);
  return (
    <div
      className={`rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}
    >
      <span className={`font-bold ${colors.text}`}>
        {initials.slice(0, 2)}
      </span>
    </div>
  );
}
