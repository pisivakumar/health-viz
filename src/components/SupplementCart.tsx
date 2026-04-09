"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CartItem } from "@/lib/types";

interface Props {
  items: CartItem[];
  onClose: () => void;
}

export default function SupplementCart({ items, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);

  // Only show supplement-type recommendations
  const supplements = items.filter((item) => item.rec.type === "supplement");
  const lifestyle = items.filter((item) => item.rec.type === "lifestyle");
  const tests = items.filter((item) => item.rec.type === "test" || item.rec.type === "consult");

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-green-500/20 bg-white p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3
            className="text-xl font-bold uppercase tracking-wide mb-2"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Plan Submitted
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your personalized supplement plan has been sent to 10X Health.
            A wellness advisor will reach out within 24 hours to finalize your order.
          </p>
          <button
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl border border-black/[0.08] bg-white overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between shrink-0">
          <div>
            <h3
              className="text-base font-bold uppercase tracking-wide"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Your Improvement Plan
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Personalized for your goals
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-muted-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Supplements */}
          {supplements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">💊</span>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-tenx-red">
                  Supplements
                </h4>
                <span className="text-[10px] text-muted-foreground">— order from 10X Health</span>
              </div>
              <div className="space-y-2">
                {supplements.map((item) => (
                  <div
                    key={item.rec.title}
                    className="flex items-start gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]"
                  >
                    <div className="w-5 h-5 rounded bg-tenx-red/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] text-tenx-red">✓</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.rec.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.rec.description}</p>
                      <p className="text-[10px] text-tenx-cherry mt-1">For: {item.systemName}</p>
                    </div>
                    {item.rec.impact === "high" && (
                      <span className="text-[8px] font-semibold uppercase tracking-wider text-green-700 bg-green-500/10 px-1.5 py-0.5 rounded shrink-0">
                        High Impact
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle */}
          {lifestyle.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🏃</span>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-green-700">
                  Lifestyle Changes
                </h4>
                <span className="text-[10px] text-muted-foreground">— free, start today</span>
              </div>
              <div className="space-y-1.5">
                {lifestyle.map((item) => (
                  <div
                    key={item.rec.title}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-black/[0.02]"
                  >
                    <span className="text-[10px] text-green-700 mt-1">●</span>
                    <div>
                      <p className="text-xs font-medium">{item.rec.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests & Consults */}
          {tests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">🔬</span>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-yellow-700">
                  Recommended Tests
                </h4>
              </div>
              <div className="space-y-1.5">
                {tests.map((item) => (
                  <div
                    key={item.rec.title}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-black/[0.02]"
                  >
                    <span className="text-[10px] text-yellow-700 mt-1">●</span>
                    <div>
                      <p className="text-xs font-medium">{item.rec.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-black/[0.06] shrink-0">
          {supplements.length > 0 ? (
            <div className="space-y-2">
              <button
                onClick={() => setSubmitted(true)}
                className="w-full text-sm font-semibold uppercase tracking-wider py-3 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity"
              >
                Get My Supplement Plan
              </button>
              <p className="text-[10px] text-center text-muted-foreground">
                A 10X Health advisor will confirm your personalized plan and pricing
              </p>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full text-sm font-semibold uppercase tracking-wider py-3 rounded-[10px] bg-black/[0.06] text-foreground hover:bg-black/[0.1] transition-colors"
            >
              Got It
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
