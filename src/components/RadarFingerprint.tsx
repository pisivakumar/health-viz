"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { BodySystem } from "@/lib/types";
import type { CartItem } from "@/lib/types";
import { STATUS_HEX, STATUS_LABELS } from "@/lib/theme";
import InfoTip from "@/components/InfoTip";
import { lookupTerm } from "@/lib/glossary";
import { getRecommendations } from "@/lib/recommendations";

interface Props {
  systems: BodySystem[];
  onSystemClick?: (systemId: string) => void;
  onGetPlan?: (items: CartItem[]) => void;
  onTalkToConcierge?: (systemName: string) => void;
}

export default function RadarFingerprint({ systems, onSystemClick, onGetPlan, onTalkToConcierge }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const values = systems.map((s) => s.score);
  const areaColors = systems.map((s) => STATUS_HEX[s.overallStatus]);

  // Systems that aren't optimal — candidates for improvement
  const improvableSystems = systems.filter((s) => s.overallStatus !== "optimal")
    .sort((a, b) => a.score - b.score);

  // All high-impact recommendations for improvable systems
  const allRecs: CartItem[] = [];
  improvableSystems.forEach((s) => {
    const recs = getRecommendations(s.id, s.score, 100);
    recs.filter((r) => r.impact === "high").forEach((r) => {
      allRecs.push({ systemName: s.name, rec: r });
    });
  });

  const option = {
    backgroundColor: "transparent",
    tooltip: { show: false },
    radar: {
      indicator: systems.map((s) => ({ name: s.name, max: 100, color: "#3B3B3A" })),
      shape: "polygon" as const,
      radius: "65%",
      axisName: { color: "#3B3B3A", fontSize: 13, fontWeight: 500 },
      splitArea: {
        areaStyle: {
          color: [
            "rgba(0,0,0,0.01)", "rgba(0,0,0,0.03)",
            "rgba(0,0,0,0.01)", "rgba(0,0,0,0.03)",
            "rgba(0,0,0,0.01)",
          ],
        },
      },
      splitLine: { lineStyle: { color: "rgba(0,0,0,0.06)" } },
      axisLine: { lineStyle: { color: "rgba(0,0,0,0.08)" } },
    },
    series: [{
      type: "radar",
      data: [{
        value: values,
        name: "Health Fingerprint",
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 1, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(209, 36, 42, 0.25)" },
              { offset: 0.5, color: "rgba(149, 48, 41, 0.15)" },
              { offset: 1, color: "rgba(209, 36, 42, 0.3)" },
            ],
          },
        },
        lineStyle: { color: "rgba(209, 36, 42, 0.85)", width: 2 },
        symbol: "circle",
        symbolSize: 10,
        itemStyle: {
          color: (params: any) => areaColors[params.dataIndex] || "#D1242A",
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },
      }],
      animationDuration: 1500,
      animationEasing: "elasticOut" as const,
    }],
  };

  // Click handler — find nearest system by angle
  const handleChartClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = chartRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width * 0.5);
    const dy = e.clientY - (rect.top + rect.height * 0.5);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 40) {
      setSelectedIdx(null);
      return;
    }

    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += 2 * Math.PI;

    const n = systems.length;
    const idx = Math.round(angle / ((2 * Math.PI) / n)) % n;
    setSelectedIdx((prev) => prev === idx ? null : idx);
  }, [systems.length]);

  const selectedSystem = selectedIdx !== null ? systems[selectedIdx] : null;

  return (
    <div>
      {/* Radar chart */}
      <div ref={chartRef} onClick={handleChartClick} className="cursor-pointer">
        <ReactECharts
          option={option}
          style={{ height: 420, width: "100%", pointerEvents: "none" }}
          opts={{ renderer: "svg" }}
        />
      </div>

      {/* Click detail card — explanation + recommendations + CTA */}
      {selectedSystem && (
        <SystemDetailCard
          system={selectedSystem}
          onViewBiomarkers={() => { if (onSystemClick) onSystemClick(selectedSystem.id); }}
          onDismiss={() => setSelectedIdx(null)}
          onGetPlan={onGetPlan}
          onTalkToConcierge={onTalkToConcierge}
        />
      )}

      {/* Passive upsell strip — always visible for non-optimal systems */}
      {!selectedSystem && improvableSystems.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Where you can improve
          </p>
          {improvableSystems.slice(0, 3).map((s) => {
            const topRec = getRecommendations(s.id, s.score, 100).find((r) => r.impact === "high");
            return (
              <button
                key={s.id}
                onClick={() => setSelectedIdx(systems.indexOf(s))}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04] hover:bg-black/[0.03] transition-colors text-left"
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    backgroundColor: STATUS_HEX[s.overallStatus] + "18",
                    color: STATUS_HEX[s.overallStatus],
                  }}
                >
                  {s.score}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{s.name}</p>
                  {topRec && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {topRec.title}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-tenx-red font-medium shrink-0">View →</span>
              </button>
            );
          })}

          {/* Get My Plan CTA */}
          {onGetPlan && allRecs.length > 0 && (
            <button
              onClick={() => onGetPlan(allRecs)}
              className="w-full mt-2 text-xs font-semibold uppercase tracking-wider py-3 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity"
            >
              Get My Improvement Plan
            </button>
          )}
        </div>
      )}

      {/* System key with InfoTips */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 mt-4 px-2">
        {systems.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_HEX[s.overallStatus] }}
            />
            <span className="text-xs text-muted-foreground truncate">{s.name}</span>
            <InfoTip term={s.id} />
          </div>
        ))}
      </div>

      {/* Status legend */}
      <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-black/[0.04] text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Optimal
          <InfoTip term="optimal" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Sub-optimal
          <InfoTip term="sub-optimal" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-tenx-red" /> Needs Attention
          <InfoTip term="out-of-range" />
        </span>
      </div>
    </div>
  );
}

// ── Detail card with recommendations built in ───────────────

function SystemDetailCard({
  system,
  onViewBiomarkers,
  onDismiss,
  onGetPlan,
  onTalkToConcierge,
}: {
  system: BodySystem;
  onViewBiomarkers: () => void;
  onDismiss: () => void;
  onGetPlan?: (items: CartItem[]) => void;
  onTalkToConcierge?: (systemName: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const recs = getRecommendations(system.id, system.score, 100);
  const isOptimal = system.overallStatus === "optimal";

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [system.id]);

  return (
    <div ref={ref} className="rounded-xl border border-black/[0.08] bg-white mt-2 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_HEX[system.overallStatus] }} />
            <span className="font-semibold text-sm">{system.name}</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: STATUS_HEX[system.overallStatus] + "18",
                color: STATUS_HEX[system.overallStatus],
              }}
            >
              {STATUS_LABELS[system.overallStatus]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ fontFamily: "'Oswald', sans-serif", color: STATUS_HEX[system.overallStatus] }}
            >
              {system.score}%
            </span>
            <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {lookupTerm(system.id)}
        </p>

        <p className="text-xs leading-relaxed mt-2" style={{ color: STATUS_HEX[system.overallStatus] }}>
          {isOptimal
            ? `Great news — your ${system.name.toLowerCase()} markers are where they should be. Keep it up.`
            : `Your ${system.name.toLowerCase()} has room to improve. Here's what can help:`}
        </p>
      </div>

      {/* Recommendations — only for non-optimal systems */}
      {!isOptimal && recs.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {recs.slice(0, 3).map((r) => (
            <div key={r.title} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-black/[0.02]">
              <span className="text-xs mt-0.5 shrink-0">{r.type === "supplement" ? "💊" : r.type === "lifestyle" ? "🏃" : "🔬"}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium">{r.title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onViewBiomarkers}
            className="flex-1 text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-lg bg-black/[0.03] text-foreground hover:bg-black/[0.06] transition-colors"
          >
            See biomarkers
          </button>
          {!isOptimal && onGetPlan && (
            <button
              onClick={() => {
                const items = recs.map((r) => ({ systemName: system.name, rec: r }));
                onGetPlan(items);
              }}
              className="flex-1 text-[11px] font-semibold uppercase tracking-wider py-2.5 rounded-[10px] bg-tenx-red text-white hover:opacity-90 transition-opacity"
            >
              Get supplements
            </button>
          )}
        </div>
        {onTalkToConcierge && (
          <button
            onClick={() => onTalkToConcierge(system.name)}
            className="w-full text-[11px] font-medium text-muted-foreground hover:text-tenx-red transition-colors py-1.5"
          >
            Have questions? Talk to your wellness concierge →
          </button>
        )}
      </div>
    </div>
  );
}
