"use client";

/**
 * SimulationView — Side-by-side orb comparison for "what-if" scenarios.
 *
 * LEFT:  Current orb (current metrics)
 * RIGHT: Simulated orb (projected metrics)
 * CENTER: Scenario selector + delta summary
 */

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  UserProfile,
  DerivedMetrics,
  TraitChip,
  ScenarioId,
  SimulationResult,
} from "@/lib/health-agent/types";
import { SCENARIOS } from "@/lib/health-agent/types";
import { simulate, applyDelta } from "@/lib/health-agent/simulation-rules";

const HealthOrb = dynamic(() => import("./HealthOrb"), { ssr: false });

interface SimulationViewProps {
  profile: UserProfile;
  metrics: DerivedMetrics;
  traits: TraitChip[];
  initialScenario?: ScenarioId;
}

export default function SimulationView({
  profile,
  metrics,
  traits,
  initialScenario,
}: SimulationViewProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(initialScenario ?? null);
  const [result, setResult] = useState<SimulationResult | null>(
    initialScenario ? simulate(initialScenario, profile, metrics) : null
  );

  const handleSelectScenario = useCallback(
    (scenario: ScenarioId) => {
      setSelectedScenario(scenario);
      const simResult = simulate(scenario, profile, metrics);
      setResult(simResult);
    },
    [profile, metrics]
  );

  const simulatedMetrics = result ? applyDelta(metrics, result.delta) : metrics;

  return (
    <div className="px-4 pb-24 space-y-4">
      {/* Scenario selector */}
      <div className="space-y-2">
        <p
          className="text-xs font-bold"
          style={{
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--twin-text-muted)",
          }}
        >
          What if you...
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SCENARIOS.map((s) => {
            const isSelected = selectedScenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectScenario(s.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: isSelected ? "rgba(209,36,42,0.15)" : "var(--twin-card)",
                  border: `1px solid ${isSelected ? "var(--twin-accent)" : "var(--twin-border)"}`,
                  color: isSelected ? "var(--twin-accent)" : "var(--twin-text-secondary)",
                }}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side orbs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-center font-medium" style={{ color: "var(--twin-text-muted)" }}>
            CURRENT
          </p>
          <HealthOrb metrics={metrics} traits={traits} height={240} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-center font-medium" style={{ color: "var(--twin-text-muted)" }}>
            {result ? "PROJECTED" : "SELECT A SCENARIO"}
          </p>
          <HealthOrb
            metrics={simulatedMetrics}
            traits={traits}
            height={240}
          />
        </div>
      </div>

      {/* Delta summary */}
      {result && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            backgroundColor: "var(--twin-card)",
            border: "1px solid var(--twin-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-bold"
              style={{
                fontFamily: "var(--font-heading)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--twin-text)",
              }}
            >
              Projected Impact
            </h3>
            <ConfidenceBadge confidence={result.confidence} />
          </div>

          {/* Metric deltas */}
          <div className="flex gap-3">
            <DeltaPill label="Energy" delta={result.delta.energy_stability} />
            <DeltaPill label="Metabolic" delta={result.delta.metabolic_balance} />
            <DeltaPill label="Stress" delta={result.delta.stress_load} />
          </div>

          {/* Explanation */}
          <p className="text-xs leading-relaxed" style={{ color: "var(--twin-text-secondary)" }}>
            {result.explanation}
          </p>

          {/* Trait changes */}
          {Object.keys(result.trait_changes).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(result.trait_changes).map(([trait, newLevel]) => (
                <span
                  key={trait}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "var(--twin-text-muted)",
                    border: "1px solid var(--twin-border-subtle)",
                  }}
                >
                  {trait.replace(/_/g, " ")} → {String(newLevel)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Delta pill ──

function DeltaPill({ label, delta }: { label: string; delta: number }) {
  const isPositive = delta > 0;
  const isStress = label === "Stress";
  // For stress, negative delta = good
  const isGood = isStress ? delta < 0 : delta > 0;
  const color = isGood ? "#22c55e" : delta === 0 ? "var(--twin-text-muted)" : "#D1242A";

  return (
    <div
      className="flex-1 rounded-lg px-3 py-2 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
    >
      <p className="text-[10px]" style={{ color: "var(--twin-text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums" style={{ color }}>
        {isPositive ? "+" : ""}
        {delta}
      </p>
    </div>
  );
}

// ── Confidence badge ──

function ConfidenceBadge({ confidence }: { confidence: "low" | "medium" | "high" }) {
  const colors: Record<string, string> = {
    low: "rgba(234,179,8,0.15)",
    medium: "rgba(34,197,94,0.1)",
    high: "rgba(34,197,94,0.2)",
  };
  const textColors: Record<string, string> = {
    low: "#eab308",
    medium: "#22c55e",
    high: "#22c55e",
  };
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
      style={{
        backgroundColor: colors[confidence],
        color: textColors[confidence],
      }}
    >
      {confidence} confidence
    </span>
  );
}
