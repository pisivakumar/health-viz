"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  context?: string; // e.g. "Blood" — what system they're asking about
}

export default function ConciergeModal({ open, onClose, context }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [method, setMethod] = useState<"call" | "text" | "schedule" | null>(null);

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setMethod(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  if (submitted) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h3 className="tenx-heading text-lg mb-2">YOU'RE ALL SET</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your wellness concierge will reach out
            {method === "call" ? " with a call" : method === "text" ? " via text" : ""} shortly to discuss
            {context ? ` your ${context} results` : " your results"}.
          </p>
          <button
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div className="text-center mb-5">
        <h3 className="tenx-heading text-lg mb-1">TALK TO YOUR CONCIERGE</h3>
        <div className="tenx-accent-line mx-auto" />
        <p className="text-sm text-muted-foreground">
          {context
            ? `Have questions about your ${context} results? Your wellness concierge can walk you through everything.`
            : "Your dedicated wellness concierge can help you understand your results and build a personalized plan."}
        </p>
      </div>

      <div className="space-y-2 mb-5">
        <ContactOption
          icon="📞"
          title="Call me now"
          description="Speak with a concierge in the next few minutes"
          selected={method === "call"}
          onClick={() => setMethod("call")}
        />
        <ContactOption
          icon="💬"
          title="Text me"
          description="Get a text from your concierge — reply on your schedule"
          selected={method === "text"}
          onClick={() => setMethod("text")}
        />
        <ContactOption
          icon="📅"
          title="Schedule a call"
          description="Pick a time that works for a 15-minute results review"
          selected={method === "schedule"}
          onClick={() => setMethod("schedule")}
        />
      </div>

      <button
        onClick={() => method && setSubmitted(true)}
        disabled={!method}
        className={`w-full text-sm font-semibold uppercase tracking-wider py-3 rounded-[10px] transition-opacity ${
          method
            ? "bg-tenx-red text-white hover:opacity-90"
            : "bg-black/[0.08] text-muted-foreground cursor-not-allowed"
        }`}
      >
        Connect me
      </button>

      <p className="text-[10px] text-center text-muted-foreground mt-3">
        Free with your 10X Health membership — no upsell, just guidance
      </p>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      style={{ isolation: "isolate" }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-black/[0.06] bg-white shadow-2xl p-6 relative z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ContactOption({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
        selected
          ? "border-tenx-red bg-tenx-red/5"
          : "border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.03]"
      }`}
    >
      <span className="text-lg shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${selected ? "text-tenx-red" : ""}`}>{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      {selected && (
        <span className="ml-auto w-5 h-5 rounded-full bg-tenx-red flex items-center justify-center shrink-0">
          <span className="text-white text-[10px]">✓</span>
        </span>
      )}
    </button>
  );
}
