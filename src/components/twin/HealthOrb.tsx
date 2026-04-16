"use client";

/**
 * HealthOrb — 3D digital twin visualization.
 *
 * A glowing sphere with custom shader material that reacts to health state:
 *   - Color: green (balanced) → yellow (moderate) → red (imbalanced)
 *   - Pulse speed: maps to stress_load
 *   - Surface distortion: maps to metabolic_balance (inverted)
 *   - Brightness: maps to energy_stability
 *
 * Orbiting trait nodes represent the 5 visible traits.
 * Clicking a node calls onTraitSelect. The agent can highlight nodes.
 */

import { useRef, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { DerivedMetrics, TraitChip } from "@/lib/health-agent/types";

// ── Color helpers ──

const COLOR_OPTIMAL = new THREE.Color("#22c55e");
const COLOR_MODERATE = new THREE.Color("#eab308");
const COLOR_ATTENTION = new THREE.Color("#D1242A");

function statusToColor(status: string): THREE.Color {
  if (status === "optimal") return COLOR_OPTIMAL.clone();
  if (status === "moderate") return COLOR_MODERATE.clone();
  return COLOR_ATTENTION.clone();
}

function metricsToOrbColor(metrics: DerivedMetrics): THREE.Color {
  // Average of energy + metabolic, weighted. Higher = greener.
  const health = (metrics.energy_stability * 0.4 + metrics.metabolic_balance * 0.4 + (100 - metrics.stress_load) * 0.2) / 100;
  const color = new THREE.Color();
  if (health > 0.65) color.lerpColors(COLOR_MODERATE, COLOR_OPTIMAL, (health - 0.65) / 0.35);
  else if (health > 0.35) color.lerpColors(COLOR_ATTENTION, COLOR_MODERATE, (health - 0.35) / 0.3);
  else color.copy(COLOR_ATTENTION);
  return color;
}

// ── Custom Shader Material ──

const orbVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uPulse;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Simplex-ish noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Noise-based displacement
    float noise = snoise(position * 2.0 + uTime * 0.3);
    float displacement = noise * uDistortion;

    // Rhythmic pulse
    float pulse = sin(uTime * uPulse) * 0.02;

    vec3 newPosition = position + normal * (displacement + pulse);
    vDisplacement = displacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const orbFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBrightness;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    // Fresnel rim glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

    // Base color with brightness
    vec3 baseColor = uColor * uBrightness;

    // Inner glow
    vec3 innerGlow = uColor * 0.3;

    // Combine
    vec3 finalColor = mix(baseColor, vec3(1.0), fresnel * 0.6);
    finalColor += innerGlow * (1.0 - fresnel);

    // Subtle displacement-based variation
    finalColor += uColor * vDisplacement * 0.5;

    float alpha = 0.85 + fresnel * 0.15;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ── Orb Sphere ──

function OrbSphere({ metrics }: { metrics: DerivedMetrics }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: metricsToOrbColor(metrics) },
      uDistortion: { value: THREE.MathUtils.mapLinear(100 - metrics.metabolic_balance, 0, 100, 0.0, 0.12) },
      uPulse: { value: THREE.MathUtils.mapLinear(metrics.stress_load, 0, 100, 1.0, 4.0) },
      uBrightness: { value: THREE.MathUtils.mapLinear(metrics.energy_stability, 0, 100, 0.4, 1.2) },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Smoothly update uniforms when metrics change
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta;

    // Smooth lerp to target values
    const targetColor = metricsToOrbColor(metrics);
    mat.uniforms.uColor.value.lerp(targetColor, delta * 2);

    const targetDistortion = THREE.MathUtils.mapLinear(100 - metrics.metabolic_balance, 0, 100, 0.0, 0.12);
    mat.uniforms.uDistortion.value += (targetDistortion - mat.uniforms.uDistortion.value) * delta * 2;

    const targetPulse = THREE.MathUtils.mapLinear(metrics.stress_load, 0, 100, 1.0, 4.0);
    mat.uniforms.uPulse.value += (targetPulse - mat.uniforms.uPulse.value) * delta * 2;

    const targetBrightness = THREE.MathUtils.mapLinear(metrics.energy_stability, 0, 100, 0.4, 1.2);
    mat.uniforms.uBrightness.value += (targetBrightness - mat.uniforms.uBrightness.value) * delta * 2;

    // Slow rotation
    meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={orbVertexShader}
        fragmentShader={orbFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Radial Glow (post-effect via sprite) ──

function OrbGlow({ metrics }: { metrics: DerivedMetrics }) {
  const ref = useRef<THREE.Sprite>(null);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.SpriteMaterial;
    const color = metricsToOrbColor(metrics);
    mat.color.lerp(color, 0.05);
  });

  return (
    <sprite ref={ref} scale={[3.5, 3.5, 1]}>
      <spriteMaterial
        color={metricsToOrbColor(metrics)}
        transparent
        opacity={0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

// ── Floating Particles ──

function Particles() {
  const count = 40;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 1.0;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.05;
    ref.current.rotation.x += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Trait Node (orbiting sphere) ──

interface TraitNodeProps {
  trait: TraitChip;
  index: number;
  total: number;
  highlighted: boolean;
  onClick: () => void;
}

function TraitNode({ trait, index, total, highlighted, onClick }: TraitNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => statusToColor(trait.status), [trait.status]);

  // Orbit parameters
  const orbitRadius = useMemo(() => {
    // Closer = more stable (optimal closer to orb)
    if (trait.status === "optimal") return 1.6;
    if (trait.status === "moderate") return 1.8;
    return 2.0;
  }, [trait.status]);

  const nodeSize = useMemo(() => {
    // Size = importance/severity
    if (trait.status === "attention") return 0.12;
    if (trait.status === "moderate") return 0.1;
    return 0.08;
  }, [trait.status]);

  const orbitSpeed = 0.2 + index * 0.03;
  const phaseOffset = (index / total) * Math.PI * 2;
  const tiltAngle = (index - total / 2) * 0.3;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * orbitSpeed + phaseOffset;
    groupRef.current.position.x = Math.cos(t) * orbitRadius;
    groupRef.current.position.z = Math.sin(t) * orbitRadius;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.3 + tiltAngle * 0.3;

    // Glow effect when highlighted
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = highlighted ? 2.0 : hovered ? 1.2 : 0.5;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;
      const targetScale = highlighted ? 1.4 : hovered ? 1.2 : 1.0;
      meshRef.current.scale.setScalar(targetScale);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[nodeSize, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Label */}
      {(hovered || highlighted) && (
        <Html center distanceFactor={5} style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap"
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "#fff",
              border: `1px solid ${color.getStyle()}`,
              transform: "translateY(-20px)",
            }}
          >
            {trait.label}: {trait.level}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Scene ──

function OrbScene({
  metrics,
  traits,
  highlightedTrait,
  onTraitSelect,
}: {
  metrics: DerivedMetrics;
  traits: TraitChip[];
  highlightedTrait: string | null;
  onTraitSelect: (traitId: string) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.2} color="#4488ff" />

      <OrbGlow metrics={metrics} />
      <OrbSphere metrics={metrics} />
      <Particles />

      {traits.map((trait, i) => (
        <TraitNode
          key={trait.id}
          trait={trait}
          index={i}
          total={traits.length}
          highlighted={highlightedTrait === trait.id}
          onClick={() => onTraitSelect(trait.id)}
        />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </>
  );
}

// ── Loading ──

function OrbLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
          style={{ borderColor: "var(--twin-accent)", borderTopColor: "transparent" }}
        />
        <p className="text-xs mt-3" style={{ color: "var(--twin-text-muted)" }}>
          Building your Health Twin...
        </p>
      </div>
    </div>
  );
}

// ── Export ──

export interface HealthOrbProps {
  metrics: DerivedMetrics;
  traits: TraitChip[];
  highlightedTrait?: string | null;
  onTraitSelect?: (traitId: string) => void;
  height?: number;
}

export default function HealthOrb({
  metrics,
  traits,
  highlightedTrait = null,
  onTraitSelect,
  height = 500,
}: HealthOrbProps) {
  const handleTraitSelect = useCallback(
    (traitId: string) => onTraitSelect?.(traitId),
    [onTraitSelect]
  );

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height, background: "radial-gradient(ellipse at center, rgba(20,20,30,1) 0%, #0a0a0a 100%)" }}>
      <Suspense fallback={<OrbLoading />}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <OrbScene
            metrics={metrics}
            traits={traits}
            highlightedTrait={highlightedTrait}
            onTraitSelect={handleTraitSelect}
          />
        </Canvas>
      </Suspense>

      {/* Metric overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <MetricPill label="Energy" value={metrics.energy_stability} />
        <MetricPill label="Metabolic" value={metrics.metabolic_balance} />
        <MetricPill label="Stress" value={metrics.stress_load} inverted />
      </div>
    </div>
  );
}

// ── Metric pill overlay ──

function MetricPill({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) {
  const displayValue = inverted ? 100 - value : value;
  const color = displayValue >= 70 ? "#22c55e" : displayValue >= 40 ? "#eab308" : "#D1242A";

  return (
    <div
      className="px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-2"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span style={{ color: "var(--twin-text-muted)" }}>{label}</span>
      <span style={{ color }} className="font-bold tabular-nums">{Math.round(value)}</span>
    </div>
  );
}
