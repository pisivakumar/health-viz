"use client";

import { motion } from "framer-motion";
import InfoTip from "@/components/InfoTip";

const ratingColors: Record<string, string> = {
  optimal: "bg-green-500",
  stable: "bg-tenx-red",
  borderline: "bg-yellow-500",
  compromised: "bg-orange-500",
  critical: "bg-red-500",
};

const ratingTextColors: Record<string, string> = {
  optimal: "text-green-600",
  stable: "text-tenx-red",
  borderline: "text-yellow-400",
  compromised: "text-orange-400",
  critical: "text-red-400",
};

export default function MitoGauge({
  label,
  rating,
  score,
}: {
  label: string;
  rating: string;
  score: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium">{label}<InfoTip term={label} /></span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-black/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${ratingColors[rating] || "bg-gray-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <span
          className={`text-xs font-medium capitalize ${ratingTextColors[rating] || "text-gray-400"}`}
        >
          {rating}<InfoTip term={rating} />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
          {score}
        </span>
      </div>
    </div>
  );
}
