/**
 * LoanMate — Skeleton Loader Components
 * Animated loading placeholders for all major data views.
 */

import { motion } from "framer-motion";

const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "linear",
  },
};

function SkeletonBlock({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] ${className ?? ""}`}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      style={{ backgroundSize: "200% 100%" }}
    />
  );
}

/** Skeleton for a single LoanCard on the Dashboard */
export function LoanCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-2.5 w-20" delay={0.1} />
        </div>
        <SkeletonBlock className="h-5 w-14 rounded-full" delay={0.05} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <SkeletonBlock className="h-12 rounded-xl" delay={0.1} />
        <SkeletonBlock className="h-12 rounded-xl" delay={0.15} />
        <SkeletonBlock className="h-12 rounded-xl" delay={0.2} />
      </div>
      <SkeletonBlock className="h-2 w-full rounded-full" delay={0.25} />
    </div>
  );
}

/** Skeleton for the Dashboard balance summary tiles */
export function BalanceSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-7 w-24" delay={0.1} />
        <SkeletonBlock className="h-2.5 w-12" delay={0.15} />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-7 w-24" delay={0.1} />
        <SkeletonBlock className="h-2.5 w-12" delay={0.15} />
      </div>
    </div>
  );
}

/** Skeleton for the Notifications screen */
export function NotificationSkeleton() {
  return (
    <div className="bg-white border border-gray-50 rounded-2xl p-4 flex items-start gap-3">
      <SkeletonBlock className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3.5 w-32" />
        <SkeletonBlock className="h-2.5 w-full" delay={0.1} />
        <SkeletonBlock className="h-2.5 w-3/4" delay={0.15} />
        <SkeletonBlock className="h-2 w-14" delay={0.2} />
      </div>
    </div>
  );
}

/** Skeleton for the Loan Details screen */
export function LoanDetailsSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#F8F9FB]">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <SkeletonBlock className="w-10 h-10 rounded-full" />
        <SkeletonBlock className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-32" delay={0.1} />
        </div>
        <SkeletonBlock className="h-6 w-16 rounded-full" delay={0.05} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">
        {/* Summary tile */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
          <SkeletonBlock className="h-4 w-32" />
          <div className="grid grid-cols-3 gap-2">
            <SkeletonBlock className="h-14 rounded-xl" delay={0.1} />
            <SkeletonBlock className="h-14 rounded-xl" delay={0.15} />
            <SkeletonBlock className="h-14 rounded-xl" delay={0.2} />
          </div>
          <SkeletonBlock className="h-2.5 w-full rounded-full" delay={0.25} />
        </div>
        {/* Payment timeline */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
          <SkeletonBlock className="h-4 w-28" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <SkeletonBlock className="w-8 h-8 rounded-full flex-shrink-0" delay={i * 0.05} />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-3 w-20" delay={i * 0.05 + 0.05} />
                <SkeletonBlock className="h-2.5 w-28" delay={i * 0.05 + 0.1} />
              </div>
              <SkeletonBlock className="h-3 w-14" delay={i * 0.05 + 0.15} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full Dashboard loading skeleton */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#F8F9FB]">
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-5 w-28" delay={0.05} />
          </div>
          <SkeletonBlock className="w-10 h-10 rounded-full" delay={0.1} />
        </div>
        <BalanceSummarySkeleton />
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 space-y-3">
        <SkeletonBlock className="h-3 w-20 mb-1" />
        <LoanCardSkeleton />
        <LoanCardSkeleton />
      </div>
    </div>
  );
}
