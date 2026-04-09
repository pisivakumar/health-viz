"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Biomarker, BodySystem } from "@/lib/types";
import { STATUS_CONFIG, sortByHealthStatus } from "@/lib/theme";
import InfoTip from "@/components/InfoTip";

function RangeGauge({ biomarker }: { biomarker: Biomarker }) {
  const { value, optimalMin, optimalMax, status } = biomarker;
  const rangeMin = optimalMin * 0.5;
  const rangeMax = optimalMax * 1.5;
  const span = rangeMax - rangeMin;

  const optLeftPct = ((optimalMin - rangeMin) / span) * 100;
  const optWidthPct = ((optimalMax - optimalMin) / span) * 100;
  const valPct = Math.max(0, Math.min(100, ((value - rangeMin) / span) * 100));

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="mt-3">
      <div className="relative h-2.5 bg-black/5 rounded-full overflow-hidden">
        {/* Optimal zone */}
        <div
          className="absolute h-full bg-green-500/20 rounded-full"
          style={{ left: `${optLeftPct}%`, width: `${optWidthPct}%` }}
        />
        {/* Value marker */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full ${cfg.dot} border-2 border-background shadow-lg`}
          style={{ left: `${valPct}%`, marginLeft: "-7px" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
        <span>{rangeMin.toFixed(0)}</span>
        <span className="text-green-500/60">
          {optimalMin}–{optimalMax} optimal
        </span>
        <span>{rangeMax.toFixed(0)}</span>
      </div>
    </div>
  );
}

function BiomarkerRow({ biomarker }: { biomarker: Biomarker }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[biomarker.status];

  return (
    <motion.div
      layout
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 cursor-pointer transition-shadow hover:shadow-lg ${cfg.glow}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="font-medium text-sm">{biomarker.name}<InfoTip term={biomarker.name} /></span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold tabular-nums ${cfg.color}`}>
            {biomarker.value}
          </span>
          <span className="text-xs text-muted-foreground">
            {biomarker.unit}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-muted-foreground text-xs"
          >
            ▼
          </motion.span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <RangeGauge biomarker={biomarker} />
            <div className="mt-3 pt-3 border-t border-black/5">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                             >
                {cfg.label}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                Optimal range: {biomarker.optimalMin}–{biomarker.optimalMax}{" "}
                {biomarker.unit}
                <InfoTip term="optimal range" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SystemCardProps {
  system: BodySystem;
  defaultExpanded?: boolean;
}

export default function SystemCard({
  system,
  defaultExpanded = false,
}: SystemCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const cfg = STATUS_CONFIG[system.overallStatus];

  // Sort biomarkers: out-of-range first, then sub-optimal, then optimal
  const sortedBiomarkers = sortByHealthStatus(system.biomarkers);

  const optimalCount = system.biomarkers.filter(
    (b) => b.status === "optimal"
  ).length;

  return (
    <motion.div
      layout
      className="rounded-2xl border border-black/[0.06] bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      <button
        className="w-full p-5 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center`}
          >
            <span className={`text-2xl font-bold ${cfg.color}`}>
              {system.score}
            </span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-base uppercase tracking-wide">
              {system.name}<InfoTip term={system.id} size="md" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {optimalCount}/{system.biomarkers.length} markers optimal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
          >
            {cfg.label}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-muted-foreground"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {sortedBiomarkers.map((b) => (
                <BiomarkerRow key={b.name} biomarker={b} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
