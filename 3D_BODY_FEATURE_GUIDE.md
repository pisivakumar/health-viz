# 3D Body Feature — Copy Guide for Team Members

Copy the 3D Body tab (interactive body model, AI voice agent, simulations, meal images) into your own Next.js app using Claude Code.

## What You're Getting

- **3D anatomical body** — clickable organs with health status colors (Three.js)
- **AI voice agent** — real-time bidirectional audio via Gemini 3.1 Flash Live API
- **Text chat agent** — Gemini 2.5 Flash with health context
- **What-if simulations** — 5 presets + natural language custom scenarios
- **Meal image generation** — Nano Banana 2 generates food photos on request
- **Product upsell cards** — contextual product recommendations with buy links
- **Health profile** — 6 traits derived from blood/genetic/mito reports

## Step 1: Prerequisites

Your app needs these dependencies:

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing framer-motion
npm install echarts echarts-for-react
```

Your app must be:
- Next.js 15+ with App Router
- React 18+
- Tailwind CSS

## Step 2: Copy These Directories

From the `health-viz` repo (https://github.com/pisivakumar/health-viz), copy:

```
# UI Components
src/components/twin/           → your-app/src/components/twin/
src/components/Body3D.tsx      → your-app/src/components/Body3D.tsx
src/components/BiomarkerCard.tsx → your-app/src/components/BiomarkerCard.tsx
src/components/SupplementCart.tsx → your-app/src/components/SupplementCart.tsx
src/components/ConciergeModal.tsx → your-app/src/components/ConciergeModal.tsx
src/components/InfoTip.tsx     → your-app/src/components/InfoTip.tsx

# Agent logic + knowledge base
src/lib/health-agent/          → your-app/src/lib/health-agent/
src/lib/hooks/useGeminiLive.ts → your-app/src/lib/hooks/useGeminiLive.ts

# API routes
src/app/api/agent/             → your-app/src/app/api/agent/

# 3D models
public/models/                 → your-app/public/models/
public/pcm-worklet-processor.js → your-app/public/pcm-worklet-processor.js

# Types (if you don't already have health report types)
src/lib/types.ts               → your-app/src/lib/types.ts
src/lib/sample-data.ts         → your-app/src/lib/sample-data.ts
```

## Step 3: Environment Variable

Add to your `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

Get one at https://aistudio.google.com/apikey

## Step 4: Wire It Into Your Page

Here's the minimal integration code. Add this to whichever page should have the 3D Body tab:

```tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Body3D from "@/components/Body3D";
import { AgentPanel, AgentBubble, TwinCard } from "@/components/twin";
import { simulate } from "@/lib/health-agent/simulation-rules";
import { SCENARIOS } from "@/lib/health-agent/types";
import type {
  UserProfile, DerivedMetrics, TraitChip, AgentMessage,
  SimulationResult, ScenarioId
} from "@/lib/health-agent/types";

// Import your health report data (blood lab, genetic, mito)
import { sampleBloodLab, sampleGenetic, sampleMitoScreen } from "@/lib/sample-data";

export default function YourPage() {
  // Twin state
  const [twinProfile, setTwinProfile] = useState<UserProfile | null>(null);
  const [twinMetrics, setTwinMetrics] = useState<DerivedMetrics | null>(null);
  const [twinTraits, setTwinTraits] = useState<TraitChip[]>([]);
  const [twinMessages, setTwinMessages] = useState<AgentMessage[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [highlightedSystem, setHighlightedSystem] = useState<string | null>(null);
  const bodySystemsRef = useRef<HTMLElement>(null);

  // Custom simulation state
  const [customSimQuery, setCustomSimQuery] = useState("");
  const [customSimLoading, setCustomSimLoading] = useState(false);

  // Initialize twin on mount
  useEffect(() => {
    async function init() {
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
    }
    init();
  }, []);

  const handleSimulate = useCallback((scenario: ScenarioId) => {
    if (!twinProfile || !twinMetrics) return;
    setSelectedScenario(scenario);
    setSimResult(simulate(scenario, twinProfile, twinMetrics));
  }, [twinProfile, twinMetrics]);

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
      const result = await res.json();
      setSimResult(result);
    } catch {
      setSimResult({ scenario: "custom", delta: { energy_stability: 0, metabolic_balance: 0, stress_load: 0 }, confidence: "low", explanation: "Could not simulate.", trait_changes: {} });
    } finally {
      setCustomSimLoading(false);
    }
  }, [customSimQuery, twinProfile, twinMetrics, twinTraits, customSimLoading]);

  const userName = "Alexander"; // Replace with actual user name

  return (
    <div>
      {/* 3D Body */}
      <Body3D
        systems={sampleBloodLab.systems}
        onSystemSelect={(id) => {
          if (id) {
            setHighlightedSystem(id);
            bodySystemsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      />

      {/* Trait chips */}
      {twinTraits.length > 0 && <TwinCard traits={twinTraits} />}

      {/* Simulations — preset buttons */}
      <div>
        {SCENARIOS.map((s) => (
          <button key={s.id} onClick={() => handleSimulate(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Simulations — custom NL input */}
      <div>
        <input
          value={customSimQuery}
          onChange={(e) => setCustomSimQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCustomSimulate(); }}
          placeholder="Or describe your own..."
        />
        <button onClick={handleCustomSimulate} disabled={customSimLoading}>
          {customSimLoading ? "Thinking..." : "Simulate"}
        </button>
      </div>

      {/* Simulation results */}
      {simResult && (
        <div>
          <p>Energy: {simResult.delta.energy_stability > 0 ? "+" : ""}{simResult.delta.energy_stability}</p>
          <p>Metabolic: {simResult.delta.metabolic_balance > 0 ? "+" : ""}{simResult.delta.metabolic_balance}</p>
          <p>Stress: {simResult.delta.stress_load > 0 ? "+" : ""}{simResult.delta.stress_load}</p>
          <p>{simResult.explanation}</p>
        </div>
      )}

      {/* Agent panel + bubble */}
      {twinProfile && twinMetrics && (
        <>
          <AgentPanel
            profile={twinProfile}
            metrics={twinMetrics}
            traits={twinTraits}
            userName={userName}
            messages={twinMessages}
            onMessagesChange={setTwinMessages}
            onHighlightTrait={(id) => setHighlightedSystem(id)}
            onRunSimulation={handleSimulate}
            onAddToCart={(item) => console.log("Add to cart:", item)}
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
```

## Step 5: Customize for Your App

### Replace sample data
Replace `sampleBloodLab`, `sampleGenetic`, `sampleMitoScreen` with your actual report data. The format is defined in `src/lib/types.ts`.

### Customize products
Edit `src/lib/health-agent/product-catalog.ts` — replace 10X Health products with your own.

### Customize agent prompts
- **Text chat**: `src/lib/health-agent/agent.ts` → `buildSystemPrompt()`
- **Voice**: `src/app/api/agent/voice-session/route.ts` → `buildVoicePrompt()`

### Customize knowledge base
Edit markdown files in `src/lib/health-agent/knowledge/` — playbooks and trait files.

### Style
The components use Tailwind with `tenx-red` as the accent color. Search and replace `tenx-red` with your brand color, or define it in your Tailwind config:

```css
/* In your globals.css or tailwind config */
--color-tenx-red: #D1242A; /* Replace with your brand color */
```

## Claude Code Prompt for Your Team Member

Give this prompt to your team member to use with Claude Code in their repo:

---

**Prompt:**

> I need to add the 3D Body feature from the health-viz repo. The source code is at https://github.com/pisivakumar/health-viz (main branch, latest commit).
>
> Follow the instructions in `3D_BODY_FEATURE_GUIDE.md` from that repo. Copy the required files into my project, install dependencies, and wire it into my [PAGE NAME] page.
>
> My app is [DESCRIBE YOUR APP — framework, existing structure].
> My health report data comes from [DESCRIBE YOUR DATA SOURCE].
> My brand color is [YOUR HEX COLOR].

---

## API Routes Reference

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/agent/init` | POST | Derive profile from health reports |
| `/api/agent/chat` | POST | Text chat with agent |
| `/api/agent/simulate` | POST | Preset scenario simulation |
| `/api/agent/simulate-custom` | POST | Natural language simulation |
| `/api/agent/voice-session` | POST | WebSocket config for voice |
| `/api/agent/tts` | POST | Text-to-speech fallback |
| `/api/agent/generate-image` | POST | Meal image generation |
| `/api/agent/daily-plan` | POST | Daily health plan |
