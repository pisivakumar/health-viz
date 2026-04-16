"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { sampleBloodLab, sampleGenetic, sampleMitoScreen } from "@/lib/sample-data";
import SystemCard from "@/components/BiomarkerCard";
import InfoTip from "@/components/InfoTip";
import HealthStory from "@/components/HealthStory";
import SupplementCart from "@/components/SupplementCart";
import ConciergeModal from "@/components/ConciergeModal";
import AgentPanel from "@/components/twin/AgentPanel";
import AgentBubble from "@/components/twin/AgentBubble";
import TwinCard from "@/components/twin/TwinCard";
import { generateBloodLabNarrative, generateGeneticNarrative, generateMitoNarrative } from "@/lib/narrative";
import MitoGauge from "@/components/MitoGauge";
import { SCENARIOS } from "@/lib/health-agent/types";
import { simulate, applyDelta } from "@/lib/health-agent/simulation-rules";
import type { CartItem } from "@/lib/types";
import type { UserProfile, DerivedMetrics, TraitChip, AgentMessage, ScenarioId, SimulationResult } from "@/lib/health-agent/types";

// These use browser APIs, so must be client-only
const RadarFingerprint = dynamic(
  () => import("@/components/RadarFingerprint"),
  { ssr: false }
);
const Body3D = dynamic(() => import("@/components/Body3D"), { ssr: false });

type Tab = "overview" | "body3d" | "blood" | "genetic" | "mito";

const activityColors: Record<string, { bg: string; text: string; label: string }> = {
  normal: { bg: "bg-green-500/10", text: "text-green-600", label: "Normal" },
  reduced: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Reduced" },
  "significantly-reduced": { bg: "bg-tenx-red/10", text: "text-tenx-red", label: "Significantly Reduced" },
};

function GeneCard({ gene }: { gene: (typeof sampleGenetic.genes)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = activityColors[gene.enzymeActivity];

  return (
    <motion.div layout className="rounded-2xl border border-black/[0.06] bg-card/50 backdrop-blur-sm overflow-hidden">
      <button
        className="w-full p-5 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${cfg.text}`}>{gene.name}</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">{gene.name}<InfoTip term={gene.name} /></h3>
            <p className="text-xs text-muted-foreground">{gene.affectedBodyPart}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-muted-foreground">▼</motion.span>
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-5 pb-5 space-y-3 overflow-hidden">
          <p className="text-sm text-muted-foreground">{gene.description}</p>
          <div className="space-y-2">
            {gene.variants.map((v) => (
              <div key={v.subAllele} className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.03]">
                <span className="text-sm font-mono">{v.subAllele}</span>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`w-3 h-3 rounded-full ${i < v.variantCount ? "bg-tenx-red" : "bg-green-500/30"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{v.result}<InfoTip term={v.result} /></span>
                </div>
              </div>
            ))}
          </div>
          {gene.symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {gene.symptoms.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] text-muted-foreground">{s}</span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Pre-generate narratives (derived from static imports — never change at runtime)
const bloodNarrative = generateBloodLabNarrative(sampleBloodLab);
const geneticNarrative = generateGeneticNarrative(sampleGenetic);
const mitoNarrative = generateMitoNarrative(sampleMitoScreen);

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "body3d", label: "3D Body" },
  { id: "blood", label: "Blood Lab" },
  { id: "genetic", label: "Genetic" },
  { id: "mito", label: "MitoScreen" },
];

const sortedSystems = [...sampleBloodLab.systems].sort((a, b) => {
  const order = { "out-of-range": 0, "sub-optimal": 1, optimal: 2 };
  return order[a.overallStatus] - order[b.overallStatus];
});

const overallOptimal = sampleBloodLab.systems.filter((s) => s.overallStatus === "optimal").length;

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [highlightedSystem, setHighlightedSystem] = useState<string | null>(null);
  const bodySystemsRef = useRef<HTMLElement>(null);
  const [cartItems, setCartItems] = useState<CartItem[] | null>(null);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeContext, setConciergeContext] = useState<string | undefined>();

  // ── Health Twin state ──
  const [twinProfile, setTwinProfile] = useState<UserProfile | null>(null);
  const [twinMetrics, setTwinMetrics] = useState<DerivedMetrics | null>(null);
  const [twinTraits, setTwinTraits] = useState<TraitChip[]>([]);
  const [twinMessages, setTwinMessages] = useState<AgentMessage[]>([]);
  const [twinInited, setTwinInited] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Init twin when switching to 3D Body tab
  useEffect(() => {
    if (tab !== "body3d" || twinInited) return;
    async function init() {
      try {
        const res = await fetch("/api/agent/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportData: [sampleBloodLab, sampleGenetic, sampleMitoScreen] }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setTwinProfile(data.profile);
        setTwinMetrics(data.metrics);
        setTwinTraits(data.traits);
        setTwinMessages([{ role: "assistant", content: data.greeting, actions: [], timestamp: Date.now() }]);
        setTwinInited(true);
      } catch (err) {
        console.error("Twin init error:", err);
      }
    }
    init();
  }, [tab, twinInited]);

  const handleSimulate = useCallback((scenario: ScenarioId) => {
    if (!twinProfile || !twinMetrics) return;
    setSelectedScenario(scenario);
    setSimResult(simulate(scenario, twinProfile, twinMetrics));
  }, [twinProfile, twinMetrics]);

  const [customSimQuery, setCustomSimQuery] = useState("");
  const [customSimLoading, setCustomSimLoading] = useState(false);

  const handleCustomSimulate = useCallback(async () => {
    const q = customSimQuery.trim();
    if (!q || !twinProfile || !twinMetrics || customSimLoading) return;
    setCustomSimLoading(true);
    setSelectedScenario("custom");
    setSimResult(null);
    try {
      const res = await fetch("/api/agent/simulate-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, profile: twinProfile, metrics: twinMetrics, traits: twinTraits }),
      });
      if (!res.ok) throw new Error("Simulation failed");
      const result = await res.json();
      setSimResult(result);
    } catch (err) {
      console.error("Custom simulation error:", err);
      setSimResult({
        scenario: "custom",
        delta: { energy_stability: 0, metabolic_balance: 0, stress_load: 0 },
        confidence: "low",
        explanation: "Sorry, I couldn't simulate that scenario. Try rephrasing your question.",
        trait_changes: {},
      });
    } finally {
      setCustomSimLoading(false);
    }
  }, [customSimQuery, twinProfile, twinMetrics, twinTraits, customSimLoading]);

  const handleAddToCartFromAgent = useCallback((item: string) => {
    setCartItems((prev) => [
      ...(prev || []),
      { systemName: "Health Agent", rec: { title: item, description: "Recommended by your Health Agent", type: "supplement" as const, impact: "medium" as const } },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-black/[0.06] bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="tenx-heading text-xl tracking-tight">
                10<span className="tenx-brand-x">X</span> HEALTH
              </h1>
              <p className="text-xs text-muted-foreground">{sampleBloodLab.patient.name} &middot; {sampleBloodLab.patient.testDate}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 tabular-nums">{overallOptimal}/{sampleBloodLab.systems.length}</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">systems optimal</p>
              </div>
              <a
                href="/knowledge"
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                title="Knowledge Base Admin"
              >
                Admin
              </a>
              <button
                onClick={() => { setConciergeContext(undefined); setConciergeOpen(true); }}
                className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity leading-tight"
              >
                Talk to<br />Concierge
              </button>
            </div>
          </div>
          <div className="flex gap-1 mt-4 p-1 bg-black/[0.03] rounded-[10px]">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2 px-3 rounded-lg transition-all ${tab === t.id ? "bg-tenx-red text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <HealthStory narrative={bloodNarrative} patientName={sampleBloodLab.patient.name} />

            <section className="rounded-2xl border border-black/[0.06] bg-card/50 backdrop-blur-sm p-5">
              <h2 className="tenx-heading text-lg mb-1">HEALTH FINGERPRINT</h2>
              <div className="tenx-accent-line" />
              <p className="text-xs text-muted-foreground mb-4">Tap any system to learn more and see recommendations</p>
              <RadarFingerprint
                systems={sampleBloodLab.systems}
                onSystemClick={(id) => { setHighlightedSystem(id); setTab("blood"); }}
                onGetPlan={(items) => setCartItems(items)}
                onTalkToConcierge={(systemName) => { setConciergeContext(systemName); setConciergeOpen(true); }}
              />
            </section>

            <section className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-black/[0.06] bg-card/50 p-4 text-center">
                <div className="tenx-heading text-3xl text-tenx-red">{sampleMitoScreen.mitoScore}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">MitoScore<InfoTip term="MitoScore" /></p>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-card/50 p-4 text-center">
                <div className="tenx-heading text-3xl text-green-600">{sampleGenetic.genes.filter((g) => g.enzymeActivity === "normal").length}/{sampleGenetic.genes.length}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Genes Normal</p>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-card/50 p-4 text-center">
                <div className="tenx-heading text-3xl text-tenx-red">{sampleBloodLab.systems.reduce((acc, s) => acc + s.biomarkers.filter((b) => b.status === "optimal").length, 0)}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Optimal Markers</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="tenx-heading text-lg">BODY SYSTEMS</h2>
              <div className="tenx-accent-line" />
              {sortedSystems.map((s) => (
                <SystemCard key={s.id} system={s} />
              ))}
            </section>
          </div>
        )}

        {tab === "body3d" && (
          <div className="space-y-6">
            {/* 3D Body */}
            <section>
              <h2 className="tenx-heading text-lg mb-1">INTERACTIVE BODY MAP</h2>
              <div className="tenx-accent-line" />
              <p className="text-xs text-muted-foreground mb-4">Rotate and tap organs to explore your biomarkers</p>
              <Body3D
                systems={sampleBloodLab.systems}
                onSystemSelect={(id) => {
                  if (id) {
                    setHighlightedSystem(id);
                    setTimeout(() => {
                      bodySystemsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }
                }}
              />
            </section>

            {/* Trait chips */}
            {twinTraits.length > 0 && (
              <section>
                <h2 className="tenx-heading text-sm mb-2">YOUR HEALTH PROFILE</h2>
                <TwinCard traits={twinTraits} />
              </section>
            )}

            {/* Simulation */}
            {twinProfile && twinMetrics && (
              <section className="rounded-2xl border border-black/[0.06] bg-card/50 backdrop-blur-sm p-5 space-y-4">
                <div>
                  <h2 className="tenx-heading text-sm mb-1">WHAT IF YOU...</h2>
                  <p className="text-xs text-muted-foreground">See how lifestyle changes could affect your scores</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {SCENARIOS.map((s) => {
                    const isSelected = selectedScenario === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSimulate(s.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-medium transition-all border ${
                          isSelected
                            ? "bg-tenx-red/10 border-tenx-red/30 text-tenx-red"
                            : "bg-black/[0.02] border-black/[0.06] text-muted-foreground hover:bg-black/[0.04]"
                        }`}
                      >
                        <span>{s.icon}</span>
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom scenario input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customSimQuery}
                    onChange={(e) => setCustomSimQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCustomSimulate(); }}
                    placeholder="Or describe your own... e.g. start running 3x per week"
                    className="flex-1 px-3 py-2 rounded-[10px] text-xs bg-black/[0.02] border border-black/[0.06] outline-none text-foreground placeholder:text-muted-foreground/60 focus:border-tenx-red/30 transition-colors"
                    disabled={customSimLoading}
                  />
                  <button
                    onClick={handleCustomSimulate}
                    disabled={!customSimQuery.trim() || customSimLoading}
                    className="shrink-0 px-3 py-2 rounded-[10px] text-xs font-medium bg-tenx-red text-white transition-opacity disabled:opacity-40"
                  >
                    {customSimLoading ? "Thinking..." : "Simulate"}
                  </button>
                </div>

                {simResult && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <SimDeltaPill label="Energy" delta={simResult.delta.energy_stability} />
                      <SimDeltaPill label="Metabolic" delta={simResult.delta.metabolic_balance} />
                      <SimDeltaPill label="Stress" delta={simResult.delta.stress_load} isStress />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{simResult.explanation}</p>
                    {Object.keys(simResult.trait_changes).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(simResult.trait_changes).map(([trait, newLevel]) => (
                          <span key={trait} className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] text-muted-foreground">
                            {trait.replace(/_/g, " ")} → {String(newLevel)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                        simResult.confidence === "high" ? "bg-green-500/10 text-green-700" : simResult.confidence === "medium" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-700"
                      }`}>
                        {simResult.confidence} confidence
                      </span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Body systems with scores */}
            <section ref={bodySystemsRef} className="space-y-3">
              <h2 className="tenx-heading text-lg">BODY SYSTEMS</h2>
              <div className="tenx-accent-line" />
              {sortedSystems.map((s) => (
                <SystemCard key={`${s.id}-${s.id === highlightedSystem ? "hl" : ""}`} system={s} defaultExpanded={s.id === highlightedSystem} />
              ))}
            </section>
          </div>
        )}

        {tab === "blood" && (
          <div className="space-y-3">
            <h2 className="tenx-heading text-lg mb-1">BLOOD LAB RESULTS</h2>
            <div className="tenx-accent-line" />
            {sortedSystems.map((s) => (
              <SystemCard key={`${s.id}-${s.id === highlightedSystem ? "hl" : ""}`} system={s} defaultExpanded={s.id === highlightedSystem} />
            ))}
          </div>
        )}

        {tab === "genetic" && (
          <div className="space-y-3">
            <HealthStory narrative={geneticNarrative} patientName={sampleGenetic.patient.name} />

            <h2 className="tenx-heading text-lg mb-1">GENETIC METHYLATION<InfoTip term="methylation" size="md" /></h2>
            <div className="tenx-accent-line" />
            <p className="text-xs text-muted-foreground mb-4">5 genes tested &middot; {sampleGenetic.genes.filter((g) => g.enzymeActivity !== "normal").length} variant(s) found</p>
            {sampleGenetic.genes.map((g) => (
              <GeneCard key={g.id} gene={g} />
            ))}
          </div>
        )}

        {tab === "mito" && (
          <div className="space-y-6">
            <HealthStory narrative={mitoNarrative} patientName={sampleMitoScreen.patient.name} />

            <section className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-tenx-red/10 via-tenx-cherry/5 to-transparent p-6 text-center">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Your MitoScore&trade;<InfoTip term="MitoScore" /></p>
              <motion.div
                className="tenx-heading text-7xl text-tenx-red"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {sampleMitoScreen.mitoScore}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">Percentile</p>
              <p className="text-xs text-tenx-red mt-1 font-medium">{sampleMitoScreen.profileType}<InfoTip term={sampleMitoScreen.profileType} /></p>
            </section>

            {[
              { title: "Energy Profile", data: sampleMitoScreen.energyProfile },
              { title: "Energy Balance", data: sampleMitoScreen.energyBalance },
              { title: "Mito ROS", data: sampleMitoScreen.mitoROS },
              { title: "Mito Network", data: sampleMitoScreen.mitoNetwork },
            ].map((section) => (
              <section key={section.title} className="rounded-2xl border border-black/[0.06] bg-card/50 p-5">
                <h3 className="tenx-heading text-sm mb-2">{section.title}</h3>
                <div className="divide-y divide-black/[0.04]">
                  {section.data.map((m) => (
                    <MitoGauge key={m.name} label={m.name} rating={m.rating} score={m.score} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Concierge CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-black/[0.06] bg-tenx-cream p-6 text-center">
          <h3 className="tenx-heading text-base mb-1">HAVE QUESTIONS ABOUT YOUR RESULTS?</h3>
          <div className="tenx-accent-line mx-auto" />
          <p className="text-sm text-muted-foreground mb-4">
            Your dedicated wellness concierge can walk you through your report,<br className="hidden sm:block" />
            explain what the numbers mean, and help you build a plan.
          </p>
          <button
            onClick={() => { setConciergeContext(undefined); setConciergeOpen(true); }}
            className="text-sm font-semibold uppercase tracking-wider px-8 py-3 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity"
          >
            Talk to Your Concierge
          </button>
          <p className="text-[10px] text-muted-foreground mt-3">Free with your 10X Health membership</p>
        </div>
      </section>

      {/* Supplement Cart Modal */}
      {cartItems && (
        <SupplementCart items={cartItems} onClose={() => setCartItems(null)} />
      )}

      {/* Concierge Modal */}
      <ConciergeModal
        open={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        context={conciergeContext}
      />

      {/* Agent panel (available on 3D Body tab) */}
      {tab === "body3d" && twinProfile && twinMetrics && (
        <>
          <AgentPanel
            profile={twinProfile}
            metrics={twinMetrics}
            traits={twinTraits}
            userName={sampleBloodLab.patient.name.split(" ")[0]}
            messages={twinMessages}
            onMessagesChange={setTwinMessages}
            onHighlightTrait={(id) => setHighlightedSystem(id)}
            onRunSimulation={handleSimulate}
            onAddToCart={handleAddToCartFromAgent}
            onOpenConcierge={() => { setConciergeContext("Health Agent"); setConciergeOpen(true); setAgentOpen(false); }}
            voiceEnabled={voiceEnabled}
            onVoiceToggle={() => setVoiceEnabled((v) => !v)}
            isOpen={agentOpen}
            onClose={() => setAgentOpen(false)}
          />
          {!agentOpen && <AgentBubble onClick={() => setAgentOpen(true)} />}
        </>
      )}
    </div>
  );
}

// ── Simulation delta pill ──

function SimDeltaPill({ label, delta, isStress = false }: { label: string; delta: number; isStress?: boolean }) {
  const isGood = isStress ? delta < 0 : delta > 0;
  const colorClass = isGood ? "text-green-700" : delta === 0 ? "text-muted-foreground" : "text-tenx-red";
  return (
    <div className="flex-1 rounded-lg px-3 py-2 text-center bg-black/[0.02]">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${colorClass}`}>
        {delta > 0 ? "+" : ""}{delta}
      </p>
    </div>
  );
}
