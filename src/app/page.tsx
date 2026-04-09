"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { sampleBloodLab, sampleGenetic, sampleMitoScreen } from "@/lib/sample-data";
import SystemCard from "@/components/BiomarkerCard";
import InfoTip from "@/components/InfoTip";
import HealthStory from "@/components/HealthStory";
import SupplementCart from "@/components/SupplementCart";
import ConciergeModal from "@/components/ConciergeModal";
import { generateBloodLabNarrative, generateGeneticNarrative, generateMitoNarrative } from "@/lib/narrative";
import MitoGauge from "@/components/MitoGauge";
import type { CartItem } from "@/lib/types";

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
  const [cartItems, setCartItems] = useState<CartItem[] | null>(null);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeContext, setConciergeContext] = useState<string | undefined>();

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
            <section>
              <h2 className="tenx-heading text-lg mb-1">INTERACTIVE BODY MAP</h2>
              <div className="tenx-accent-line" />
              <p className="text-xs text-muted-foreground mb-4">Rotate and tap organs to explore your biomarkers</p>
              <Body3D
                systems={sampleBloodLab.systems}
                onSystemSelect={(id) => {
                  if (id) setHighlightedSystem(id);
                }}
              />
            </section>
          </div>
        )}

        {tab === "blood" && (
          <div className="space-y-3">
            <h2 className="tenx-heading text-lg mb-1">BLOOD LAB RESULTS</h2>
            <div className="tenx-accent-line" />
            {sortedSystems.map((s) => (
              <SystemCard key={s.id} system={s} defaultExpanded={s.id === highlightedSystem} />
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
    </div>
  );
}
