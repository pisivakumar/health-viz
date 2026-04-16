# 10X Adaptive Health Twin — Design Spec (v2)

**Date:** 2026-04-16  
**Status:** Approved — merges original Health Twin Canvas design + 3D MVP PRD  
**MVP Timeline:** 2–3 weeks

## Context

The current 10X Health app is a tabbed dashboard showing static report visualizations (blood lab, genetic, MitoScreen). Users see charts, biomarker cards, and supplement recommendations.

The **Adaptive Health Twin** introduces a fundamentally different experience: a **living 3D digital twin** (orb with orbiting trait nodes) + a **conversational AI agent** with voice. Users don't read charts — they talk to their data and see it respond visually.

Ships as a **new `/twin` route alongside the existing dashboard**. Existing dashboard unchanged.

---

## What We're Building (MVP)

### Five integrated pieces:

1. **3D Orb Twin** — Glowing sphere with orbiting trait nodes, reactive to health state
2. **Simulation Engine** — Rule-based "what-if" with side-by-side orb comparison
3. **Conversational Agent** — Persistent side panel, text + voice (Gemini 3.1 Flash TTS)
4. **Daily Plan** — Today's actionable recommendations as card stack
5. **Upsell Flow** — Contextual supplement/concierge recommendations woven into conversation

### Parked for later:
- Realistic human avatar (replace orb when quality 3D asset available)
- Food Scan (camera-based meal analysis)
- ML-based simulation (replace rule engine)
- Wearable integration, longitudinal tracking

---

## 1. DATA MODEL

### 1.1 User Profile (derived from 10X reports)

Computed from existing blood lab, genetic, and MitoScreen data. The LLM (on init) maps 40+ biomarkers → 6 simplified traits.

```typescript
interface UserProfile {
  caffeine_sensitivity: "low" | "moderate" | "high";
  carb_tolerance: "low" | "moderate" | "high";
  fat_metabolism: "low" | "moderate" | "high";
  inflammation_tendency: "low" | "moderate" | "high";
  recovery_rate: "slow" | "moderate" | "fast";
  sleep_quality_tendency: "poor" | "average" | "good";
}

interface DerivedMetrics {
  energy_stability: number;    // 0-100
  metabolic_balance: number;   // 0-100
  stress_load: number;         // 0-100
}
```

**Mapping rules** (in `knowledge-base.json`):
- `caffeine_sensitivity` ← COMT gene variants + cortisol levels
- `carb_tolerance` ← HbA1c + glucose + insulin + genetic markers
- `fat_metabolism` ← lipid panel (triglycerides, HDL, LDL ratios)
- `inflammation_tendency` ← CRP markers + liver enzymes (AST, ALT) + WBC
- `recovery_rate` ← MitoScore + hormone levels (testosterone, IGF-1, DHEA)
- `sleep_quality_tendency` ← cortisol pattern + thyroid function + genetic MTHFR/COMT

**Derived metrics** are weighted composites:
- `energy_stability` = f(carb_tolerance, caffeine_sensitivity, sleep_quality)
- `metabolic_balance` = f(fat_metabolism, inflammation, recovery_rate)
- `stress_load` = f(cortisol, inflammation, sleep_quality)

### 1.2 Simulation Delta

```typescript
interface SimulationResult {
  delta: {
    energy_stability: number;   // e.g., +10
    metabolic_balance: number;  // e.g., +5
    stress_load: number;        // e.g., -15
  };
  confidence: "low" | "medium" | "high";
  explanation: string;
  trait_changes: Partial<UserProfile>;  // which traits shift
}
```

### 1.3 Daily Plan

```typescript
interface DailyPlan {
  nutrition: PlanCard;
  supplements: PlanCard;
  activity: PlanCard;
}

interface PlanCard {
  title: string;
  items: string[];
  badge: string;  // "Based on your metabolic profile"
}
```

---

## 2. ARCHITECTURE: "Thin Harness, Fat Skills"

### Layer 1: Fat Skill Layer (`src/lib/health-agent/`)

**`knowledge-base.json`** — Structured health domain knowledge:
- Biomarker → trait mappings (40+ biomarkers → 6 traits)
- Cause-effect chain templates
- Simulation rules (scenario → delta mappings)
- Supplement → system impact mappings (from existing `recommendations.ts`)
- Compliance vocabulary (must/must-not word lists)

**`system-prompt.md`** — Agent persona + reasoning:
- Persona: 10X Health wellness agent — warm, knowledgeable, never medical advice
- Compliance: Always use "may", "tendency", "suggests". Never diagnose/treat/reference diseases
- Response format: Structured JSON with `text`, `actions[]`, optional `upsellCard`
- Upsell rules: Explain problem first → recommend naturally → never lead with sales
- Handoff rules: When to suggest concierge
- Response style: Always include Insight + Reason + Suggestion

**`simulation-rules.ts`** — Rule-based simulation engine:
```typescript
// Example rule
if (profile.caffeine_sensitivity === "high" && scenario === "reduce_caffeine") {
  delta.energy_stability += 10;
  delta.stress_load -= 15;
  trait_changes.sleep_quality_tendency = improve(current);
}
```
- Predefined scenarios: reduce caffeine, high protein diet, intermittent fasting, increase sleep, high carb diet
- Each rule maps (profile state + scenario) → metric deltas + explanations
- Confidence based on how many profile traits the scenario affects

**`tools.ts`** — Agent-invokable actions:
- `highlightNode(traitId)` — Glow a trait node on the orb
- `showUpsellCard({ product, description })` — Inline product card in chat
- `openConcierge(context)` — Trigger existing ConciergeModal
- `runSimulation(scenario)` — Trigger side-by-side orb comparison
- `addToCart(cartItem)` — Add to existing SupplementCart
- `showDailyPlan()` — Switch to Today tab with generated plan

### Layer 2: Thin Agent Layer (`src/lib/health-agent/agent.ts`)

```typescript
async function chat(message: string, context: AgentContext): Promise<AgentResponse>
async function initAnalysis(reports: HealthReport[]): Promise<InitResponse>
async function simulate(scenario: string, profile: UserProfile): SimulationResult
async function generateDailyPlan(profile: UserProfile, optional?: { sleep, stress }): DailyPlan
```

- `chat()` calls reasoning LLM (provider-agnostic, follows `extract.ts` pattern)
- `simulate()` is pure rule-based — no LLM call needed
- `generateDailyPlan()` uses knowledge base + profile, optionally LLM for personalization
- `initAnalysis()` calls LLM once to derive profile + greeting

### Layer 3: Display Layer (React Components)

---

## 3. 3D ORB VISUALIZATION

### 3.1 Tech Stack
- React Three Fiber (already installed: `@react-three/fiber`, `@react-three/drei`)
- Custom shaders for orb effects
- Framer Motion for UI overlays

### 3.2 Orb (Digital Twin)

**Base:** Sphere geometry with custom shader material

**Visual mapping:**
| Profile State | Orb Property |
|---------------|-------------|
| Overall health balance | Color: green (balanced) → yellow (moderate) → red (imbalanced) |
| `stress_load` | Pulse speed: low stress = slow calm pulse, high = fast agitated |
| `metabolic_balance` | Surface distortion: high balance = smooth, low = noisy/distorted |
| `energy_stability` | Brightness/emissiveness: stable = bright, unstable = dim/flickering |

**Ambient effects:**
- Soft radial glow around orb
- Subtle particle system (floating motes)
- Slowly auto-rotates

### 3.3 Trait Nodes (Orbiting)

5 smaller spheres orbiting the orb, one per visible trait:
- caffeine, carbs, inflammation, recovery, sleep

**Node properties:**
| Trait State | Node Property |
|-------------|--------------|
| Importance | Node size |
| Intensity/severity | Glow brightness |
| Stability | Distance from orb (closer = more stable) |

**Colors:** Use existing status colors from `theme.ts`:
- Green (`#22c55e`) = optimal/good
- Yellow (`#eab308`) = moderate/attention
- Red (`#D1242A`) = high/elevated

### 3.4 Interactions

- **Click node** → Detail panel slides in from side:
  - Trait label + status
  - Plain-language explanation (from glossary + knowledge base)
  - Suggestions (from recommendations)
  - "Learn more" → triggers agent conversation about this trait
- **Click orb** → Shows overall profile summary
- **Agent drives orb** → Agent can highlight nodes, trigger glow changes

### 3.5 Animations
- Orb: continuous slow rotation + rhythmic pulse
- Nodes: orbit paths (slight wobble for organic feel)
- Transitions: smooth color/size interpolation when state changes (e.g., after simulation)

---

## 4. SIMULATION ENGINE

### 4.1 Simulate View

**Layout:** Side-by-side split
- LEFT: Current orb (with current trait nodes)
- RIGHT: Simulated orb (shows projected state)
- CENTER: Scenario selector + delta summary

### 4.2 Predefined Scenarios

| Scenario | Affected Traits | Typical Deltas |
|----------|----------------|----------------|
| Reduce caffeine | caffeine, sleep, energy | energy +10, stress -15, sleep improved |
| High protein diet | carbs, energy, recovery | metabolic +8, energy +5 |
| Intermittent fasting | fat_metabolism, inflammation | metabolic +12, inflammation reduced |
| Increase sleep | sleep, recovery, energy | energy +15, stress -10, recovery improved |
| High carb diet | carbs, energy, inflammation | energy -10, metabolic -8 |

### 4.3 Simulation Flow
1. User selects scenario (preset buttons or asks agent)
2. `simulate(scenario, profile)` runs rule engine
3. Simulated orb renders with updated properties:
   - Color shifts toward result state
   - Surface smooths/roughens
   - Pulse speed changes
   - Trait nodes resize/recolor/reposition
4. Delta summary shows: "Energy +10, Stress -15, Sleep improves"
5. Animated transition between current → simulated (2-3 second morph)
6. Agent comments on the simulation result with explanation

### 4.4 Agent-Driven Simulation
User can also ask the agent: "What if I stop caffeine?"
→ Agent calls `runSimulation("reduce_caffeine")` action
→ View switches to Simulate tab with side-by-side orbs

---

## 5. AGENT PANEL + VOICE

### 5.1 Agent Panel (`AgentPanel.tsx`)

**Layout:** Persistent right-side panel (~320px)
- Header: Agent avatar + "Your Health Agent" + status + voice toggle
- Profile strip: Compact trait chip badges (scrollable)
- Messages: Agent bubbles (left), user bubbles (right), upsell cards inline
- Footer: Text input + mic button + send button

### 5.2 Voice Mode (`VoiceMode.tsx`)

- **Input:** Web Speech API (`webkitSpeechRecognition`) for speech-to-text
- **Output:** Gemini 3.1 Flash TTS via `POST /api/agent/tts`
  - Model: `gemini-3.1-flash-tts-preview`
  - Audio tags for natural delivery: `[short pause]`, warm tone
  - Streaming: Server sends audio chunks, client plays progressively
- **UI states:** Idle → Listening (pulsing mic) → Processing → Speaking (waveform)
- **Toggle:** On/off from panel header. When on, all agent responses are spoken.

### 5.3 Upsell Cards (`UpsellCard.tsx`)

Rendered inline in chat when agent includes `show_upsell` action:
- Product icon + name + description
- "Add to My Plan" → pushes to existing SupplementCart
- "Talk to Concierge" → opens existing ConciergeModal with context
- Styled: subtle red-tinted card, dark theme

### 5.4 Compliance

All agent responses MUST follow:
- **Use:** "may", "tendency", "suggests", "your profile indicates"
- **Never:** diagnose, treat, reference diseases, provide medical advice
- Enforced in system prompt + post-processing validation

---

## 6. DAILY PLAN (Today Tab)

### 6.1 Layout

Card stack (like iOS widgets), dark themed:

**Card 1: Nutrition**
- "Go lighter on carbs today" / "Add omega-3 rich foods"
- Badge: "Based on your metabolic profile"

**Card 2: Supplements**
- "Take magnesium in evening" / "Vitamin D3 with morning meal"
- Each has "Add to Plan" CTA → SupplementCart

**Card 3: Activity**
- "Light workout recommended" / "20 min morning walk"
- Badge: "Based on your recovery rate"

### 6.2 Generation

- On tab switch to Today: calls `generateDailyPlan(profile, { sleep, stress })`
- Optional sleep/stress input (quick toggle: good/okay/bad) adjusts recommendations
- Uses knowledge base rules, optionally LLM for personalization

---

## 7. NAVIGATION

Bottom tab bar (4 tabs):
- 🧠 **Twin** — 3D orb view + trait card
- 🔮 **Simulate** — Side-by-side comparison
- 📅 **Today** — Daily plan cards
- 📷 **Scan** — Placeholder (future food scan)

Agent panel is ALWAYS visible on right side regardless of active tab.

---

## 8. DARK THEME (Scoped)

Only `/twin` route. Implemented via wrapper class `.twin-dark`.

| Token | Value |
|-------|-------|
| Page bg | `#0a0a0a` |
| Card bg | `#111111` |
| Elevated surface | `#1a1a1a` |
| Primary text | `#ffffff` |
| Secondary text | `#cccccc` |
| Muted text | `#888888` |
| Subtle text | `#555555` |
| Border subtle | `#1a1a1a` |
| Border visible | `#333333` |
| Brand accent | `#D1242A` (10X red) |
| Agent bubble bg | `rgba(255,255,255,0.05)` |
| User bubble bg | `rgba(209,36,42,0.15)` |

Status colors: Same green/yellow/red as existing `theme.ts`.

---

## 9. API ROUTES

**`POST /api/agent/init`**
- Input: `{ reportData: HealthReport[] }`
- Output: `{ profile: UserProfile, metrics: DerivedMetrics, traits: TraitChip[], greeting: string }`
- LLM maps 40+ biomarkers → 6 traits + derived metrics

**`POST /api/agent/chat`**
- Input: `{ message, profile, metrics, conversationHistory }`
- Output: `{ text, actions: AgentAction[], upsellCard? }`
- Reasoning LLM with fat skill system prompt

**`POST /api/agent/tts`**
- Input: `{ text, voice? }`
- Output: Audio stream (MP3)
- Gemini 3.1 Flash TTS

**`POST /api/agent/simulate`**
- Input: `{ scenario, profile, metrics }`
- Output: `SimulationResult`
- Pure rule-based, no LLM call

**`POST /api/agent/daily-plan`**
- Input: `{ profile, metrics, sleep?, stress? }`
- Output: `DailyPlan`

---

## 10. FILE STRUCTURE

```
src/
├── app/twin/
│   ├── page.tsx                    # Main page — layout + state management
│   └── layout.tsx                  # Dark theme wrapper
├── components/twin/
│   ├── HealthOrb.tsx               # 3D orb + trait nodes (R3F)
│   ├── SimulationView.tsx          # Side-by-side orb comparison
│   ├── TwinCard.tsx                # Metabolic profile trait chips
│   ├── BodyMap.tsx                 # Cause-effect network graph
│   ├── AgentPanel.tsx              # Chat side panel
│   ├── AgentBubble.tsx             # Floating trigger bubble (mobile)
│   ├── VoiceMode.tsx               # Voice input/output
│   ├── UpsellCard.tsx              # Inline product card
│   ├── DailyPlanView.tsx           # Today tab card stack
│   └── BottomNav.tsx               # 4-tab bottom navigation
├── lib/health-agent/
│   ├── agent.ts                    # Thin orchestration layer
│   ├── types.ts                    # All new types
│   ├── knowledge-base.json         # Domain knowledge + mappings
│   ├── system-prompt.md            # Agent persona + compliance
│   ├── simulation-rules.ts         # Rule-based simulation engine
│   └── tools.ts                    # Action definitions
└── app/api/agent/
    ├── chat/route.ts
    ├── init/route.ts
    ├── tts/route.ts
    ├── simulate/route.ts
    └── daily-plan/route.ts
```

---

## 11. EXISTING CODE TO REUSE

| What | File | How |
|------|------|-----|
| ConciergeModal | `src/components/ConciergeModal.tsx` | Agent "Talk to Concierge" CTA |
| SupplementCart | `src/components/SupplementCart.tsx` | Agent "Add to Plan" CTA |
| InfoTip | `src/components/InfoTip.tsx` | Node detail explanations |
| Recommendations | `src/lib/recommendations.ts` | Types + supplement data for upsell |
| Data types | `src/lib/types.ts` | `HealthStatus`, `BodySystem`, `HealthReport`, `CartItem` |
| Sample data | `src/lib/sample-data.ts` | Dev/demo data feed |
| Theme | `src/lib/theme.ts` | `STATUS_CONFIG` colors |
| Glossary | `src/lib/glossary.ts` | Plain-language explanations |
| LLM pattern | `src/lib/extract.ts` | Provider-agnostic LLM call pattern |
| R3F packages | `package.json` | `@react-three/fiber`, `drei`, Three.js already installed |

---

## 12. SUCCESS CRITERIA

- User uploads/views report → sees 3D twin orb in <10 seconds
- Can click trait nodes → understands "why" in plain language
- Can simulate scenarios → sees visible orb transformation
- Can chat with agent → gets personalized, compliant wellness advice
- Can hear agent speak (voice mode) → natural delivery via Gemini TTS
- Upsell cards appear naturally → "Add to Plan" and "Talk to Concierge" work
- Existing dashboard at `/` completely unaffected
- Feels: "This understands my body"

---

## 13. VERIFICATION

### Build: `npm run build`

### E2E Test (`e2e-twin.mjs`):
- Page loads dark theme, no white flash
- 3D orb renders with trait nodes
- Click node → detail panel with explanation
- Agent greeting appears
- Chat round-trip works
- Simulation: select scenario → two orbs render, delta shown
- Upsell card CTA → SupplementCart/ConciergeModal work
- Today tab → plan cards render
- Voice toggle changes UI state
- Existing `/` dashboard unaffected

### API smoke tests for all 5 endpoints
