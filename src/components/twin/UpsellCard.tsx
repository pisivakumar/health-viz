"use client";

/**
 * UpsellCard — Inline product recommendation card with price and buy link.
 * Shows in the agent chat when the agent recommends a product from the catalog.
 */

import type { UpsellCardData } from "@/lib/health-agent/types";

interface UpsellCardProps {
  card: UpsellCardData;
  onTalkToConcierge?: () => void;
}

export default function UpsellCard({ card, onTalkToConcierge }: UpsellCardProps) {
  const isBuyNow = card.cta === "buy_now" && card.url;
  const isConcierge = card.cta === "talk_to_concierge";

  return (
    <div className="rounded-xl p-3 my-2 space-y-2 bg-tenx-red/5 border border-tenx-red/15">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{card.product}</p>
          <p className="text-xs mt-0.5 text-muted-foreground">{card.description}</p>
        </div>
        {card.price && (
          <span className="text-sm font-bold shrink-0 text-tenx-red">{card.price}</span>
        )}
      </div>

      {isBuyNow ? (
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 rounded-[10px] text-xs font-semibold text-center bg-tenx-red text-white hover:opacity-90 transition-opacity"
        >
          Buy Now →
        </a>
      ) : isConcierge ? (
        <button
          onClick={() => onTalkToConcierge?.()}
          className="w-full py-2 rounded-[10px] text-xs font-semibold text-tenx-red border border-tenx-red/30 hover:bg-tenx-red/5 transition-colors"
        >
          Talk to Concierge
        </button>
      ) : (
        <a
          href={card.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 rounded-[10px] text-xs font-semibold text-center bg-tenx-red text-white hover:opacity-90 transition-opacity"
        >
          Learn More →
        </a>
      )}
    </div>
  );
}
