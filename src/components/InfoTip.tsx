"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lookupTerm } from "@/lib/glossary";

interface InfoTipProps {
  /** The term to look up in the glossary */
  term: string;
  /** Optional override text (skips glossary lookup) */
  explanation?: string;
  /** Size variant */
  size?: "sm" | "md";
}

export default function InfoTip({ term, explanation, size = "sm" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const text = explanation || lookupTerm(term);

  // Don't render if no explanation found
  if (!text) return null;

  return (
    <span className="relative inline-flex items-center ml-1">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`inline-flex items-center justify-center rounded-full border border-black/10 bg-black/[0.04] hover:bg-black/[0.08] text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${
          size === "sm" ? "w-4 h-4 text-[9px]" : "w-5 h-5 text-[10px]"
        }`}
        aria-label={`What is ${term}?`}
      >
        i
      </span>

      <AnimatePresence>
        {open && (
          <InfoTooltip text={text} term={term} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </span>
  );
}

function InfoTooltip({
  text,
  term,
  onClose,
}: {
  text: string;
  term: string;
  onClose: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-[90vw]"
    >
      <div className="rounded-xl border border-black/[0.08] bg-white shadow-xl p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-tenx-red">
            {term}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
    </motion.div>
  );
}
