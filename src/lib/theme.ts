/**
 * Shared status colors, labels, and sort utilities.
 *
 * Single source of truth — used by RadarFingerprint, BiomarkerCard,
 * Body3D, page.tsx, and any new component that needs status styling.
 */

import type { HealthStatus } from "./types";

// ── Status Colors (hex) ─────────────────────────────────────

export const STATUS_HEX: Record<HealthStatus, string> = {
  optimal: "#22c55e",
  "sub-optimal": "#eab308",
  "out-of-range": "#D1242A",
};

// ── Status Tailwind Classes ─────────────────────────────────

export const STATUS_CONFIG: Record<HealthStatus, {
  color: string;
  bg: string;
  border: string;
  glow: string;
  dot: string;
  label: string;
}> = {
  optimal: {
    color: "text-green-700",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    glow: "shadow-green-500/10",
    dot: "bg-green-600",
    label: "Optimal",
  },
  "sub-optimal": {
    color: "text-yellow-700",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    glow: "shadow-yellow-500/10",
    dot: "bg-yellow-600",
    label: "Sub-optimal",
  },
  "out-of-range": {
    color: "text-tenx-red",
    bg: "bg-tenx-red/10",
    border: "border-tenx-red/20",
    glow: "shadow-tenx-red/10",
    dot: "bg-tenx-red",
    label: "Needs Attention",
  },
};

export const STATUS_LABELS: Record<HealthStatus, string> = {
  optimal: "Optimal",
  "sub-optimal": "Sub-optimal",
  "out-of-range": "Needs Attention",
};

// ── Sorting ─────────────────────────────────────────────────

const STATUS_SEVERITY: Record<HealthStatus, number> = {
  "out-of-range": 0,
  "sub-optimal": 1,
  optimal: 2,
};

export function sortByHealthStatus<T extends { overallStatus?: HealthStatus; status?: HealthStatus }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const aStatus = a.overallStatus ?? a.status ?? "optimal";
    const bStatus = b.overallStatus ?? b.status ?? "optimal";
    return STATUS_SEVERITY[aStatus] - STATUS_SEVERITY[bStatus];
  });
}

// ── Biomarker Status Computation ────────────────────────────

export function computeBiomarkerStatus(
  value: number,
  optimalMin: number,
  optimalMax: number
): HealthStatus {
  if (value >= optimalMin && value <= optimalMax) return "optimal";
  const range = optimalMax - optimalMin;
  const margin = range * 0.2;
  if (value >= optimalMin - margin && value <= optimalMax + margin) return "sub-optimal";
  return "out-of-range";
}

export function computeSystemScore(
  biomarkers: { value: number; optimalMin: number; optimalMax: number }[]
): number {
  const optimal = biomarkers.filter(
    (b) => b.value >= b.optimalMin && b.value <= b.optimalMax
  ).length;
  return Math.round((optimal / biomarkers.length) * 100);
}

export function computeSystemStatus(score: number): HealthStatus {
  if (score >= 80) return "optimal";
  if (score >= 50) return "sub-optimal";
  return "out-of-range";
}
