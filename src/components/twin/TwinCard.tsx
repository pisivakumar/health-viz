"use client";

/**
 * TwinCard — Compact trait chip badges showing the user's 6-trait profile.
 * Light theme — matches the existing 10X Health dashboard.
 */

import type { TraitChip } from "@/lib/health-agent/types";

interface TwinCardProps {
  traits: TraitChip[];
  onTraitClick?: (traitId: string) => void;
  highlightedTrait?: string | null;
}

export default function TwinCard({ traits, onTraitClick, highlightedTrait }: TwinCardProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {traits.map((trait) => {
        const isHighlighted = highlightedTrait === trait.id;
        const statusClass =
          trait.status === "optimal"
            ? "bg-green-500/10 border-green-500/20 text-green-700"
            : trait.status === "moderate"
            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-700"
            : "bg-tenx-red/10 border-tenx-red/20 text-tenx-red";

        return (
          <button
            key={trait.id}
            onClick={() => onTraitClick?.(trait.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${statusClass}`}
            style={{
              boxShadow: isHighlighted ? "0 0 8px rgba(209,36,42,0.2)" : "none",
              transform: isHighlighted ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                trait.status === "optimal" ? "bg-green-600" : trait.status === "moderate" ? "bg-yellow-600" : "bg-tenx-red"
              }`}
            />
            {trait.label}
            <span className="text-muted-foreground capitalize">{trait.level}</span>
          </button>
        );
      })}
    </div>
  );
}
