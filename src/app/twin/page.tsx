"use client";

/**
 * Health Twin — Main Page.
 *
 * Layout:
 *   - Left/Center: Tab content (Twin orb, Simulate, Today, Scan)
 *   - Right: Agent panel (persistent, Phase 5)
 *   - Bottom: Tab navigation
 *
 * State flow:
 *   1. On mount, call /api/agent/init with sample reports
 *   2. Store profile, metrics, traits in state
 *   3. Render current tab content
 *   4. Agent actions can switch tabs, highlight traits, trigger simulation
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { sampleBloodLab, sampleGenetic, sampleMitoScreen } from "@/lib/sample-data";
import type {
  UserProfile,
  DerivedMetrics,
  TraitChip,
  TwinTab,
  AgentMessage,
  ScenarioId,
} from "@/lib/health-agent/types";
import type { CartItem } from "@/lib/types";
import BottomNav from "@/components/twin/BottomNav";
import TwinCard from "@/components/twin/TwinCard";
import DailyPlanView from "@/components/twin/DailyPlanView";
import SimulationView from "@/components/twin/SimulationView";
import AgentPanel from "@/components/twin/AgentPanel";
import AgentBubble from "@/components/twin/AgentBubble";
import SupplementCart from "@/components/SupplementCart";
import ConciergeModal from "@/components/ConciergeModal";

// Dynamic imports for heavy 3D components
const HealthOrb = dynamic(() => import("@/components/twin/HealthOrb"), { ssr: false });

export default function TwinPage() {
  // ── Core state ──
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null);
  const [traits, setTraits] = useState<TraitChip[]>([]);
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<TwinTab>("twin");
  const [highlightedTrait, setHighlightedTrait] = useState<string | null>(null);
  const [simulationScenario, setSimulationScenario] = useState<ScenarioId | undefined>();

  // ── Agent state ──
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // ── Cart + Concierge state ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);

  // ── Initialize ──
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/agent/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportData: [sampleBloodLab, sampleGenetic, sampleMitoScreen],
          }),
        });

        if (!res.ok) throw new Error("Failed to initialize health twin");

        const data = await res.json();
        setProfile(data.profile);
        setMetrics(data.metrics);
        setTraits(data.traits);
        setGreeting(data.greeting);

        // Add greeting as first agent message
        setMessages([
          {
            role: "assistant",
            content: data.greeting,
            actions: [],
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
        console.error("Init error:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── Trait click handler ──
  const handleTraitSelect = useCallback((traitId: string) => {
    setHighlightedTrait((prev) => (prev === traitId ? null : traitId));
  }, []);

  // ── Tab change ──
  const handleTabChange = useCallback((tab: TwinTab) => {
    setActiveTab(tab);
    setHighlightedTrait(null);
  }, []);

  // ── Simulation trigger (from agent) ──
  const handleRunSimulation = useCallback((scenario: ScenarioId) => {
    setSimulationScenario(scenario);
    setActiveTab("simulate");
  }, []);

  // ── Add to cart ──
  const handleAddToCart = useCallback((item: string) => {
    setCart((prev) => [
      ...prev,
      {
        systemName: "Health Twin",
        rec: { title: item, description: "Added from your daily plan", type: "supplement" as const, impact: "medium" as const },
      },
    ]);
    setCartOpen(true);
  }, []);

  // ── Show daily plan (from agent action) ──
  const handleShowDailyPlan = useCallback(() => {
    setActiveTab("today");
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto"
            style={{ borderColor: "var(--twin-accent)", borderTopColor: "transparent" }}
          />
          <p style={{ color: "var(--twin-text-muted)" }} className="text-sm">
            Analyzing your reports...
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !profile || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3 px-6">
          <p className="text-lg font-semibold" style={{ color: "var(--twin-text)" }}>
            Something went wrong
          </p>
          <p className="text-sm" style={{ color: "var(--twin-text-muted)" }}>
            {error || "Could not initialize your Health Twin."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "var(--twin-accent)", color: "#fff" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ marginRight: agentOpen ? 340 : 0, transition: "margin-right 0.3s ease" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <h1
            className="text-lg font-bold tracking-wider"
            style={{ fontFamily: "var(--font-heading)", textTransform: "uppercase" }}
          >
            HEALTH <span style={{ color: "var(--twin-accent)" }}>TWIN</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: "rgba(209,36,42,0.15)",
                color: "var(--twin-accent)",
                border: "1px solid rgba(209,36,42,0.3)",
              }}
            >
              Cart ({cart.length})
            </button>
          )}
          <button
            onClick={() => setAgentOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: "rgba(209,36,42,0.1)",
              color: "var(--twin-accent)",
              border: "1px solid rgba(209,36,42,0.2)",
            }}
          >
            💬 Agent
          </button>
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: "var(--twin-text-muted)",
              border: "1px solid var(--twin-border)",
            }}
          >
            Dashboard
          </a>
        </div>
      </header>

      {/* Tab content */}
      <main>
        {activeTab === "twin" && (
          <div className="space-y-4">
            <HealthOrb
              metrics={metrics}
              traits={traits}
              highlightedTrait={highlightedTrait}
              onTraitSelect={handleTraitSelect}
              height={420}
            />
            <TwinCard
              traits={traits}
              onTraitClick={handleTraitSelect}
              highlightedTrait={highlightedTrait}
            />

            {/* Trait detail (when a trait is selected) */}
            {highlightedTrait && (
              <TraitDetail
                trait={traits.find((t) => t.id === highlightedTrait)!}
                onClose={() => setHighlightedTrait(null)}
                onSimulate={(scenario) => handleRunSimulation(scenario)}
              />
            )}

            {/* Agent greeting */}
            {greeting && !highlightedTrait && (
              <div className="px-4">
                <div
                  className="rounded-xl p-4 text-sm leading-relaxed"
                  style={{
                    backgroundColor: "var(--twin-agent-bubble)",
                    border: "1px solid var(--twin-border-subtle)",
                    color: "var(--twin-text-secondary)",
                  }}
                >
                  {greeting}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "simulate" && (
          <SimulationView
            profile={profile}
            metrics={metrics}
            traits={traits}
            initialScenario={simulationScenario}
          />
        )}

        {activeTab === "today" && (
          <DailyPlanView
            profile={profile}
            metrics={metrics}
            onAddToPlan={handleAddToCart}
          />
        )}

        {activeTab === "scan" && (
          <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
            <div className="text-center space-y-3">
              <span className="text-4xl">📷</span>
              <p className="text-sm font-medium" style={{ color: "var(--twin-text-muted)" }}>
                Food Scan — Coming Soon
              </p>
              <p className="text-xs" style={{ color: "var(--twin-text-subtle)" }}>
                Point your camera at a meal to get instant nutritional guidance
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Agent panel */}
      <AgentPanel
        profile={profile}
        metrics={metrics}
        traits={traits}
        messages={messages}
        onMessagesChange={setMessages}
        onHighlightTrait={handleTraitSelect}
        onRunSimulation={handleRunSimulation}
        onAddToCart={handleAddToCart}
        onOpenConcierge={() => setConciergeOpen(true)}
        onShowDailyPlan={handleShowDailyPlan}
        voiceEnabled={voiceEnabled}
        onVoiceToggle={() => setVoiceEnabled((v) => !v)}
        isOpen={agentOpen}
        onClose={() => setAgentOpen(false)}
      />

      {/* Floating agent bubble (when panel is closed) */}
      {!agentOpen && (
        <AgentBubble onClick={() => setAgentOpen(true)} />
      )}

      {/* Supplement cart modal */}
      {cartOpen && (
        <SupplementCart
          items={cart}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* Concierge modal */}
      <ConciergeModal
        open={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        context="Health Twin Agent"
      />
    </div>
  );
}

// ── Trait Detail Card ──

function TraitDetail({
  trait,
  onClose,
  onSimulate,
}: {
  trait: TraitChip;
  onClose: () => void;
  onSimulate: (scenario: ScenarioId) => void;
}) {
  // Map trait → relevant simulation scenario
  const scenarioMap: Record<string, ScenarioId> = {
    caffeine_sensitivity: "reduce_caffeine",
    carb_tolerance: "high_protein",
    fat_metabolism: "intermittent_fasting",
    sleep_quality_tendency: "increase_sleep",
    inflammation_tendency: "intermittent_fasting",
    recovery_rate: "increase_sleep",
  };

  const scenario = scenarioMap[trait.id];
  const statusColors: Record<string, string> = {
    optimal: "#22c55e",
    moderate: "#eab308",
    attention: "#D1242A",
  };

  return (
    <div className="px-4">
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          backgroundColor: "var(--twin-card)",
          border: `1px solid ${statusColors[trait.status]}30`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColors[trait.status] }}
            />
            <h3 className="text-sm font-semibold" style={{ color: "var(--twin-text)" }}>
              {trait.label}
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full capitalize"
              style={{
                backgroundColor: `${statusColors[trait.status]}15`,
                color: statusColors[trait.status],
              }}
            >
              {trait.level}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs"
            style={{ color: "var(--twin-text-muted)" }}
          >
            Close
          </button>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "var(--twin-text-secondary)" }}>
          {trait.description}
        </p>

        {scenario && (
          <button
            onClick={() => onSimulate(scenario)}
            className="w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: "rgba(209,36,42,0.1)",
              color: "var(--twin-accent)",
              border: "1px solid rgba(209,36,42,0.2)",
            }}
          >
            🔮 Simulate improvement
          </button>
        )}
      </div>
    </div>
  );
}
