"use client";

import { useRef, useState, useCallback, Suspense, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import type { BodySystem } from "@/lib/types";

// ============================================================
// Status styling
// ============================================================

const STATUS_COLORS: Record<string, THREE.Color> = {
  optimal: new THREE.Color("#22c55e"),
  "sub-optimal": new THREE.Color("#eab308"),
  "out-of-range": new THREE.Color("#D1242A"),
};

const STATUS_TW: Record<string, { text: string; bg: string; label: string }> = {
  optimal: { text: "text-green-400", bg: "bg-green-500", label: "Optimal" },
  "sub-optimal": { text: "text-yellow-400", bg: "bg-yellow-500", label: "Sub-optimal" },
  "out-of-range": { text: "text-red-400", bg: "bg-red-500", label: "Attention" },
};

// ============================================================
// Organ config with labels, positions, and health context
// ============================================================

interface OrganConfig {
  systemId: string;
  organName: string;
  models: string[];
  labelPosition: [number, number, number]; // where to show the always-visible label
  labelSide: "left" | "right";
  description: string; // what this organ system does
  lowScoreMeaning: string; // what a bad score means for the person
}

const ORGAN_CONFIGS: OrganConfig[] = [
  {
    systemId: "lipids",
    organName: "Heart",
    models: ["/models/heart.glb"],
    labelPosition: [0.025, 0.48, 0.02],
    labelSide: "right",
    description: "Cholesterol and lipid levels that affect cardiovascular health",
    lowScoreMeaning: "Elevated risk of plaque buildup in arteries, may lead to heart disease over time",
  },
  {
    systemId: "liver",
    organName: "Liver",
    models: ["/models/liver.glb"],
    labelPosition: [-0.035, 0.39, 0.0],
    labelSide: "left",
    description: "Detoxification, protein synthesis, and bile production",
    lowScoreMeaning: "Liver may be under stress from toxins, alcohol, or medications — enzymes are elevated",
  },
  {
    systemId: "kidneys",
    organName: "Kidneys",
    models: ["/models/kidney_l.glb", "/models/kidney_r.glb"],
    labelPosition: [0.1, 0.30, 0.0],
    labelSide: "right",
    description: "Filter blood, regulate electrolytes, and maintain fluid balance",
    lowScoreMeaning: "Filtration efficiency reduced — may affect blood pressure and waste removal",
  },
  {
    systemId: "sugar_metabolism",
    organName: "Pancreas",
    models: ["/models/pancreas.glb"],
    labelPosition: [-0.04, 0.33, 0.02],
    labelSide: "left",
    description: "Blood sugar regulation through insulin production",
    lowScoreMeaning: "Blood sugar control is impaired — risk of insulin resistance and energy crashes",
  },
  {
    systemId: "blood",
    organName: "Spleen",
    models: ["/models/spleen.glb"],
    labelPosition: [0.08, 0.38, 0.02],
    labelSide: "right",
    description: "Blood cell production, immune function, and oxygen transport",
    lowScoreMeaning: "Blood cell counts or oxygen capacity may be off — can cause fatigue and weak immunity",
  },
  {
    systemId: "prostate",
    organName: "Prostate",
    models: ["/models/prostate.glb"],
    labelPosition: [0.04, 0.12, 0.03],
    labelSide: "right",
    description: "Prostate-specific antigen levels for prostate health monitoring",
    lowScoreMeaning: "PSA levels outside normal range — should be discussed with your provider",
  },
];

const CONTEXT_ORGAN_COLOR = new THREE.Color("#556677");

// Additional visual-only organs (not clickable, provide body context)
const CONTEXT_ORGANS = [
  { url: "/models/lung.glb", label: "Lungs", position: [0.0, 0.55, 0.0] as [number, number, number] },
];

// ============================================================
// Organ mesh with material coloring
// ============================================================

function OrganModel({
  url,
  color,
  emissiveIntensity,
  isSelected,
  opacity,
  onClick,
}: {
  url: string;
  color: THREE.Color;
  emissiveIntensity: number;
  isSelected: boolean;
  opacity: number;
  onClick?: () => void;
}) {
  const { scene } = useGLTF(url);
  const [hovered, setHovered] = useState(false);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity,
          transparent: true,
          opacity,
          roughness: 0.3,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
      }
    });
    return clone;
  }, [scene]);

  // Update material properties without re-cloning the scene
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.color.copy(color);
        mat.emissive.copy(color);
        mat.emissiveIntensity = isSelected ? emissiveIntensity * 2.5 : hovered ? emissiveIntensity * 1.8 : emissiveIntensity;
        mat.opacity = isSelected ? 0.95 : hovered ? 0.85 : opacity;
        mat.needsUpdate = true;
      }
    });
  }, [clonedScene, color, emissiveIntensity, isSelected, hovered, opacity]);

  return (
    <primitive
      object={clonedScene}
      onClick={onClick ? (e: any) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? (e: any) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onClick ? () => { setHovered(false); document.body.style.cursor = "default"; } : undefined}
    />
  );
}

// ============================================================
// Always-visible label that floats next to organ
// ============================================================

function OrganLabel({
  config,
  system,
  isSelected,
  onClick,
}: {
  config: OrganConfig;
  system: BodySystem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const st = STATUS_TW[system.overallStatus];

  return (
    <Html position={config.labelPosition} center style={{ pointerEvents: "auto" }}>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
          isSelected
            ? "bg-background/95 border-white/20 shadow-xl scale-105"
            : "bg-background/70 border-white/[0.08] hover:bg-background/90 hover:border-white/15"
        }`}
        style={{ backdropFilter: "blur(12px)", transform: `translateX(${config.labelSide === "left" ? "-110%" : "10%"})` }}
      >
        <span className={`w-2 h-2 rounded-full ${st.bg} shrink-0 ${system.overallStatus === "out-of-range" ? "animate-pulse" : ""}`} />
        <span className="text-[11px] font-medium text-foreground/90">{config.organName}</span>
        <span className={`text-[11px] font-bold tabular-nums ${st.text}`}>{system.score}</span>
      </button>
    </Html>
  );
}

// ============================================================
// Transparent body shell
// ============================================================

function SkinShell() {
  const { scene } = useGLTF("/models/skin.glb");
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#667788"),
          transparent: true,
          opacity: 0.06,
          roughness: 0.9,
          metalness: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }
    });
    return c;
  }, [scene]);

  return <primitive object={cloned} />;
}

// ============================================================
// Scene
// ============================================================

function Scene({
  systems,
  selectedId,
  onSelect,
}: {
  systems: BodySystem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const systemMap = useMemo(() => Object.fromEntries(systems.map((s) => [s.id, s])), [systems]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 5]} intensity={0.6} />
      <directionalLight position={[-2, 1, -3]} intensity={0.3} color="#4488ff" />
      <pointLight position={[0, 0.5, 0.3]} intensity={0.3} />

      <SkinShell />

      {/* Context organs (visual only, not clickable) */}
      {CONTEXT_ORGANS.map((organ) => (
        <group key={organ.url}>
          <OrganModel
            url={organ.url}
            color={CONTEXT_ORGAN_COLOR}
            emissiveIntensity={0.1}
            isSelected={false}
            opacity={0.15}
          />
          <Html position={organ.position as [number, number, number]} center style={{ pointerEvents: "none" }}>
            <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap">{organ.label}</span>
          </Html>
        </group>
      ))}

      {/* Health-mapped organs */}
      {ORGAN_CONFIGS.map((config) => {
        const system = systemMap[config.systemId];
        if (!system) return null;

        const color = STATUS_COLORS[system.overallStatus];
        const intensity = system.overallStatus === "out-of-range" ? 0.8 : system.overallStatus === "sub-optimal" ? 0.5 : 0.3;
        const isSelected = selectedId === config.systemId;

        return (
          <group key={config.systemId}>
            {config.models.map((url) => (
              <OrganModel
                key={url}
                url={url}
                color={color}
                emissiveIntensity={intensity}
                isSelected={isSelected}
                opacity={isSelected ? 0.9 : 0.7}
                onClick={() => onSelect(isSelected ? null : config.systemId)}
              />
            ))}
            <OrganLabel
              config={config}
              system={system}
              isSelected={isSelected}
              onClick={() => onSelect(isSelected ? null : config.systemId)}
            />
          </group>
        );
      })}

      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={0.4}
        maxDistance={2.5}
        autoRotate
        autoRotateSpeed={0.6}
        target={[0, 0.35, 0]}
      />
    </>
  );
}

// ============================================================
// Loading
// ============================================================

function LoadingIndicator() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground mt-3">Loading anatomy...</p>
      </div>
    </div>
  );
}

// ============================================================
// Export
// ============================================================

interface Body3DProps {
  systems: BodySystem[];
  onSystemSelect?: (systemId: string | null) => void;
}

export default function Body3D({ systems, onSystemSelect }: Body3DProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      onSystemSelect?.(id);
    },
    [onSystemSelect]
  );

  const selected = selectedId ? systems.find((s) => s.id === selectedId) : null;
  const selectedConfig = selectedId ? ORGAN_CONFIGS.find((c) => c.systemId === selectedId) : null;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.04] bg-[#060a14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,60,120,0.12)_0%,transparent_70%)]" />

        <div className="relative" style={{ height: 580 }}>
          <Suspense fallback={<LoadingIndicator />}>
            <Canvas
              camera={{ position: [0, 0.4, 1.4], fov: 38 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              onPointerMissed={() => handleSelect(null)}
            >
              <Scene systems={systems} selectedId={selectedId} onSelect={handleSelect} />
            </Canvas>
          </Suspense>
        </div>

        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-[10px] text-muted-foreground/40">
            Drag to rotate &middot; Scroll to zoom &middot; Click organs to inspect
          </span>
        </div>
      </div>

      {/* Detail panel with health context */}
      <AnimatePresence>
        {selected && selectedConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-card/50 backdrop-blur-sm p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_TW[selected.overallStatus].bg}`} />
                  <span className="font-semibold">{selectedConfig.organName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_TW[selected.overallStatus].bg}/10 ${STATUS_TW[selected.overallStatus].text}`}>
                    {STATUS_TW[selected.overallStatus].label}
                  </span>
                </div>
                <button onClick={() => handleSelect(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>

              {/* What this organ does */}
              <p className="text-xs text-muted-foreground mb-1">{selectedConfig.description}</p>

              {/* What a bad score means (only show if not optimal) */}
              {selected.overallStatus !== "optimal" && (
                <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
                  selected.overallStatus === "out-of-range"
                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                    : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                }`}>
                  ⚠ {selectedConfig.lowScoreMeaning}
                </div>
              )}

              {/* Biomarker list */}
              <div className="space-y-1.5 mt-3">
                {[...selected.biomarkers]
                  .sort((a, b) => {
                    const order = { "out-of-range": 0, "sub-optimal": 1, optimal: 2 };
                    return order[a.status] - order[b.status];
                  })
                  .map((b) => {
                    const bst = STATUS_TW[b.status];
                    const rangeMin = b.optimalMin * 0.5;
                    const rangeMax = b.optimalMax * 1.5;
                    const span = rangeMax - rangeMin;
                    const valPct = Math.max(2, Math.min(98, ((b.value - rangeMin) / span) * 100));
                    const optLeftPct = ((b.optimalMin - rangeMin) / span) * 100;
                    const optWidthPct = ((b.optimalMax - b.optimalMin) / span) * 100;
                    return (
                      <div key={b.name} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                        <span className={`w-1.5 h-1.5 rounded-full ${bst.bg} shrink-0`} />
                        <span className="text-xs text-muted-foreground w-28 truncate">{b.name}</span>
                        <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full relative">
                          <div className="absolute h-full bg-green-500/15 rounded-full" style={{ left: `${optLeftPct}%`, width: `${optWidthPct}%` }} />
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${bst.bg} border border-background`}
                            style={{ left: `${valPct}%`, marginLeft: -5 }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums w-16 text-right ${bst.text}`}>
                          {b.value} <span className="text-muted-foreground font-normal text-[9px]">{b.unit}</span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Optimal</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Sub-optimal</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Needs Attention</span>
      </div>
    </div>
  );
}

// Preload
ORGAN_CONFIGS.forEach((c) => c.models.forEach((url) => useGLTF.preload(url)));
CONTEXT_ORGANS.forEach((o) => useGLTF.preload(o.url));
useGLTF.preload("/models/skin.glb");
