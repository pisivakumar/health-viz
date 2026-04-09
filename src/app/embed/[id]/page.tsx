"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import type {
  BloodLabReport,
  GeneticReport,
  MitoScreenReport,
  HealthReport,
} from "@/lib/types";
import SystemCard from "@/components/BiomarkerCard";
import { motion } from "framer-motion";

const RadarFingerprint = dynamic(
  () => import("@/components/RadarFingerprint"),
  { ssr: false }
);
const Body3D = dynamic(() => import("@/components/Body3D"), { ssr: false });

type Tab = "overview" | "body3d" | "blood" | "genetic" | "mito";

function MitoGauge({
  label,
  rating,
  score,
}: {
  label: string;
  rating: string;
  score: number;
}) {
  const ratingColors: Record<string, string> = {
    optimal: "bg-green-500",
    stable: "bg-blue-500",
    borderline: "bg-yellow-500",
    compromised: "bg-orange-500",
    critical: "bg-red-500",
  };
  const ratingTextColors: Record<string, string> = {
    optimal: "text-green-400",
    stable: "text-blue-400",
    borderline: "text-yellow-400",
    compromised: "text-orange-400",
    critical: "text-red-400",
  };

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${ratingColors[rating] || "bg-gray-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <span
          className={`text-xs font-medium capitalize ${ratingTextColors[rating] || "text-gray-400"}`}
        >
          {rating}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
          {score}
        </span>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [highlightedSystem, setHighlightedSystem] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/report/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Report not found");
        return res.json();
      })
      .then((data) => setReport(data.report))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-red-400 font-medium">Report not found</p>
          <p className="text-xs text-muted-foreground">This report may have expired or the link is invalid.</p>
        </div>
      </div>
    );
  }

  // Render based on report type
  if (report.type === "blood-lab") return <BloodLabEmbed report={report} tab={tab} setTab={setTab} highlightedSystem={highlightedSystem} setHighlightedSystem={setHighlightedSystem} />;
  if (report.type === "genetic") return <GeneticEmbed report={report} />;
  if (report.type === "mitoscreen") return <MitoEmbed report={report} />;

  return null;
}

function BloodLabEmbed({
  report,
  tab,
  setTab,
  highlightedSystem,
  setHighlightedSystem,
}: {
  report: BloodLabReport;
  tab: Tab;
  setTab: (t: Tab) => void;
  highlightedSystem: string | null;
  setHighlightedSystem: (s: string | null) => void;
}) {
  const sortedSystems = [...report.systems].sort((a, b) => {
    const order = { "out-of-range": 0, "sub-optimal": 1, optimal: 2 };
    return (order[a.overallStatus] ?? 2) - (order[b.overallStatus] ?? 2);
  });

  const overallOptimal = report.systems.filter((s) => s.overallStatus === "optimal").length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "body3d", label: "3D Body" },
    { id: "blood", label: "Blood Lab" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06] bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">10X Health</h1>
              <p className="text-xs text-muted-foreground">
                {report.patient.name} &middot; {report.patient.testDate}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400 tabular-nums">
                {overallOptimal}/{report.systems.length}
              </div>
              <p className="text-[10px] text-muted-foreground">systems optimal</p>
            </div>
          </div>
          <div className="flex gap-1 mt-4 p-1 bg-white/[0.03] rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-all ${
                  tab === t.id
                    ? "bg-white/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section className="rounded-2xl border border-white/[0.06] bg-card/50 backdrop-blur-sm p-5">
              <h2 className="text-lg font-semibold mb-1">Health Fingerprint</h2>
              <p className="text-xs text-muted-foreground mb-4">Tap any axis to drill into that body system</p>
              <RadarFingerprint
                systems={report.systems}
                onSystemClick={(id) => {
                  setHighlightedSystem(id);
                  setTab("blood");
                }}
              />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Body Systems</h2>
              {sortedSystems.map((s) => (
                <SystemCard key={s.id} system={s} />
              ))}
            </section>
          </motion.div>
        )}

        {tab === "body3d" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-1">Interactive Body Map</h2>
              <p className="text-xs text-muted-foreground mb-4">Rotate and tap organs to explore your biomarkers</p>
              <Body3D
                systems={report.systems}
                onSystemSelect={(id) => {
                  if (id) setHighlightedSystem(id);
                }}
              />
            </section>
          </motion.div>
        )}

        {tab === "blood" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h2 className="text-lg font-semibold mb-4">Blood Lab Results</h2>
            {sortedSystems.map((s) => (
              <SystemCard key={s.id} system={s} defaultExpanded={s.id === highlightedSystem} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function GeneticEmbed({ report }: { report: GeneticReport }) {
  const activityColors: Record<string, { bg: string; text: string; label: string }> = {
    normal: { bg: "bg-green-500/10", text: "text-green-400", label: "Normal" },
    reduced: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Reduced" },
    "significantly-reduced": { bg: "bg-red-500/10", text: "text-red-400", label: "Significantly Reduced" },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06] bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">10X Health — Genetic Methylation</h1>
          <p className="text-xs text-muted-foreground">{report.patient.name} &middot; {report.patient.testDate}</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        <p className="text-xs text-muted-foreground mb-4">
          {report.genes.length} genes tested &middot;{" "}
          {report.genes.filter((g) => g.enzymeActivity !== "normal").length} variant(s) found
        </p>
        {report.genes.map((gene) => {
          const cfg = activityColors[gene.enzymeActivity];
          return (
            <div key={gene.id} className="rounded-2xl border border-white/[0.06] bg-card/50 backdrop-blur-sm p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                  <span className={`text-sm font-bold ${cfg.text}`}>{gene.name}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{gene.name}</h3>
                  <p className="text-xs text-muted-foreground">{gene.affectedBodyPart}</p>
                </div>
                <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{gene.description}</p>
              <div className="space-y-2">
                {gene.variants.map((v) => (
                  <div key={v.subAllele} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03]">
                    <span className="text-sm font-mono">{v.subAllele}</span>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={`w-3 h-3 rounded-full ${i < v.variantCount ? "bg-red-500" : "bg-green-500/30"}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{v.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

function MitoEmbed({ report }: { report: MitoScreenReport }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06] bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">10X Health — MitoScreen</h1>
          <p className="text-xs text-muted-foreground">{report.patient.name} &middot; {report.patient.testDate}</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">Your MitoScore&trade;</p>
          <motion.div
            className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {report.mitoScore}
          </motion.div>
          <p className="text-sm text-muted-foreground mt-2">Percentile</p>
          <p className="text-xs text-blue-400 mt-1 font-medium">{report.profileType}</p>
        </section>

        {[
          { title: "Energy Profile", data: report.energyProfile },
          { title: "Energy Balance", data: report.energyBalance },
          { title: "Mito ROS", data: report.mitoROS },
          { title: "Mito Network", data: report.mitoNetwork },
        ].map((section) => (
          <section key={section.title} className="rounded-2xl border border-white/[0.06] bg-card/50 p-5">
            <h3 className="text-sm font-semibold mb-2">{section.title}</h3>
            <div className="divide-y divide-white/[0.04]">
              {section.data.map((m) => (
                <MitoGauge key={m.name} label={m.name} rating={m.rating} score={m.score} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
