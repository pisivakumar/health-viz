"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { renderBold } from "@/lib/render-markdown";

interface Props {
  narrative: string;
  patientName: string;
}

/**
 * Renders the AI-generated "Your Health Story" narrative.
 * Supports **bold** markdown syntax inline.
 */
export default function HealthStory({ narrative, patientName }: Props) {
  const [expanded, setExpanded] = useState(true);

  const firstName = patientName.split(" ")[0];

  const paragraphs = narrative.split("\n\n").filter(Boolean);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-card/50 backdrop-blur-sm overflow-hidden">
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tenx-red/10 flex items-center justify-center">
            <span className="text-tenx-red text-lg">✦</span>
          </div>
          <div className="text-left">
            <h2
              className="text-base font-bold uppercase tracking-wide"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Your Health Story
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              AI-generated summary for {firstName}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-muted-foreground"
        >
          ▼
        </motion.span>
      </button>

      {expanded && (
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
            <div className="h-[3px] w-12 bg-tenx-red rounded-full mb-4" />
            <div className="space-y-3">
              {paragraphs.map((p, i) => {
                // Handle bullet points
                if (p.startsWith("• ") || p.startsWith("- ")) {
                  return (
                    <div key={i} className="pl-3 border-l-2 border-tenx-red/20">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {renderBold(p)}
                      </p>
                    </div>
                  );
                }
                // Handle separator
                if (p.trim() === "---") {
                  return <hr key={i} className="border-white/[0.06] my-2" />;
                }
                return (
                  <p
                    key={i}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {renderBold(p)}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
