/**
 * LoanMate — InviteMetricsCard
 * A compact analytics card showing invitation metrics.
 * Used on the Profile screen and optionally on the Dashboard.
 */
import { motion } from "framer-motion";
import {
  Send,
  MessageSquare,
  Link2,
  UserCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { InvitationMetrics } from "@/types/invitation";

// WhatsApp SVG icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface InviteMetricsCardProps {
  metrics: InvitationMetrics;
}

export default function InviteMetricsCard({
  metrics,
}: InviteMetricsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#1B2E4B]/5 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#1B2E4B]" />
        </div>
        <h3 className="text-gray-900 font-bold text-sm">Invitation Analytics</h3>
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-[#1B2E4B]">{metrics.total_sent}</p>
          <p className="text-gray-400 text-[10px] font-medium mt-0.5">Sent</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-emerald-600">
            {metrics.registrations}
          </p>
          <p className="text-gray-400 text-[10px] font-medium mt-0.5">
            Registered
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-blue-600">
            {metrics.conversion_rate}%
          </p>
          <p className="text-gray-400 text-[10px] font-medium mt-0.5">
            Conversion
          </p>
        </div>
      </div>

      {/* Breakdown by method */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-gray-500 text-xs">{metrics.sms_sent} SMS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />
          <span className="text-gray-500 text-xs">
            {metrics.whatsapp_sent} WhatsApp
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-gray-500 text-xs">
            {metrics.link_copied} Links
          </span>
        </div>
      </div>
    </motion.div>
  );
}
