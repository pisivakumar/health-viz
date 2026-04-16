"use client";

/**
 * DailyPlanView — Today tab card stack.
 * Shows nutrition, supplements, and activity cards with actionable items.
 */

import { useState, useEffect, useCallback } from "react";
import type { DailyPlan, UserProfile, DerivedMetrics } from "@/lib/health-agent/types";

const CARD_ICONS: Record<string, string> = {
  nutrition: "🥗",
  supplements: "💊",
  activity: "🏃",
};

interface DailyPlanViewProps {
  profile: UserProfile;
  metrics: DerivedMetrics;
  onAddToPlan?: (item: string) => void;
}

export default function DailyPlanView({ profile, metrics, onAddToPlan }: DailyPlanViewProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState<{ sleep?: "good" | "okay" | "bad"; stress?: "good" | "okay" | "bad" }>({});

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, metrics, ...mood }),
      });
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      console.error("Failed to fetch daily plan:", err);
    } finally {
      setLoading(false);
    }
  }, [profile, metrics, mood]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return (
    <div className="px-4 pb-24 space-y-4">
      {/* Quick mood input */}
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--twin-text-muted)" }}>
          How are you feeling today?
        </p>
        <div className="flex gap-3">
          <MoodSelector
            label="Sleep"
            value={mood.sleep}
            onChange={(v) => setMood((m) => ({ ...m, sleep: v }))}
          />
          <MoodSelector
            label="Stress"
            value={mood.stress}
            onChange={(v) => setMood((m) => ({ ...m, stress: v }))}
          />
        </div>
      </div>

      {/* Plan cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 animate-pulse"
              style={{ backgroundColor: "var(--twin-card)", height: 120 }}
            />
          ))}
        </div>
      ) : plan ? (
        <>
          <PlanCardView card={plan.nutrition} type="nutrition" onAddToPlan={onAddToPlan} />
          <PlanCardView card={plan.supplements} type="supplements" onAddToPlan={onAddToPlan} />
          <PlanCardView card={plan.activity} type="activity" onAddToPlan={onAddToPlan} />
        </>
      ) : (
        <p className="text-sm" style={{ color: "var(--twin-text-muted)" }}>
          Could not load your daily plan. Please try again.
        </p>
      )}
    </div>
  );
}

// ── Plan Card ──

function PlanCardView({
  card,
  type,
  onAddToPlan,
}: {
  card: { title: string; items: string[]; badge: string };
  type: string;
  onAddToPlan?: (item: string) => void;
}) {
  const icon = CARD_ICONS[type] || "📋";

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--twin-card)",
        border: "1px solid var(--twin-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3
            className="text-sm font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--twin-text)",
            }}
          >
            {card.title}
          </h3>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "rgba(209,36,42,0.1)",
            color: "var(--twin-accent)",
            border: "1px solid rgba(209,36,42,0.15)",
          }}
        >
          {card.badge}
        </span>
      </div>

      <ul className="space-y-2">
        {card.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--twin-text-secondary)" }}>
            <span className="mt-0.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "var(--twin-accent)" }} />
            <span className="flex-1">{item}</span>
            {type === "supplements" && onAddToPlan && (
              <button
                onClick={() => onAddToPlan(item)}
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-full transition-colors"
                style={{
                  color: "var(--twin-accent)",
                  border: "1px solid rgba(209,36,42,0.3)",
                }}
              >
                + Add
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Mood selector ──

function MoodSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: "good" | "okay" | "bad";
  onChange: (v: "good" | "okay" | "bad") => void;
}) {
  const options: { val: "good" | "okay" | "bad"; emoji: string }[] = [
    { val: "good", emoji: "😊" },
    { val: "okay", emoji: "😐" },
    { val: "bad", emoji: "😫" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px]" style={{ color: "var(--twin-text-muted)" }}>
        {label}:
      </span>
      {options.map((opt) => (
        <button
          key={opt.val}
          onClick={() => onChange(opt.val)}
          className="text-base transition-transform"
          style={{
            transform: value === opt.val ? "scale(1.3)" : "scale(1)",
            opacity: value && value !== opt.val ? 0.4 : 1,
          }}
        >
          {opt.emoji}
        </button>
      ))}
    </div>
  );
}
