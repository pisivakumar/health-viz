# Health Twin — Drop-in Integration Guide

Add an AI health agent with real-time voice, what-if simulations, and product recommendations to any Next.js app.

## What You Get

- **Voice agent** — bidirectional audio chat via Gemini 3.1 Flash Live API (WebSocket)
- **Text agent** — REST-based chat via Gemini 2.5 Flash
- **Simulations** — 5 preset scenarios + natural language custom simulations
- **Product upsell** — cards with buy links, triggered contextually by the agent
- **Knowledge base** — editable markdown playbooks + trait files with admin UI

## Prerequisites

- Next.js 15+ with App Router
- React 18+
- Tailwind CSS
- Node.js 18+

## 1. Copy These Directories

```
your-app/
  src/
    components/twin/       ← from src/components/twin/
    lib/
      health-agent/        ← from src/lib/health-agent/
      hooks/useGeminiLive.ts  ← from src/lib/hooks/useGeminiLive.ts
    app/api/agent/         ← from src/app/api/agent/
  public/
    pcm-worklet-processor.js  ← from public/pcm-worklet-processor.js
```

Optional (admin UI for editing knowledge base):
```
    app/api/knowledge/     ← from src/app/api/knowledge/
    app/knowledge/         ← from src/app/knowledge/
```

## 2. Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
```

Get one at https://aistudio.google.com/apikey

## 3. Wire Up the Components

```tsx
import { AgentPanel, AgentBubble, TwinCard } from "@/components/twin";
import type { UserProfile, DerivedMetrics, TraitChip, AgentMessage } from "@/lib/health-agent";

function YourPage() {
  const [agentOpen, setAgentOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  // These come from /api/agent/init
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null);
  const [traits, setTraits] = useState<TraitChip[]>([]);

  return (
    <>
      {profile && metrics && (
        <AgentPanel
          profile={profile}
          metrics={metrics}
          traits={traits}
          userName="Alexander"
          messages={messages}
          onMessagesChange={setMessages}
          onHighlightTrait={(id) => { /* highlight in your UI */ }}
          onRunSimulation={(scenario) => { /* run simulation */ }}
          onAddToCart={(item) => { /* add to cart */ }}
          voiceEnabled={voiceEnabled}
          onVoiceToggle={() => setVoiceEnabled(v => !v)}
          isOpen={agentOpen}
          onClose={() => setAgentOpen(false)}
        />
      )}
      {!agentOpen && <AgentBubble onClick={() => setAgentOpen(true)} />}
    </>
  );
}
```

## 4. Initialize the Agent

Call `/api/agent/init` with your health report data to derive the user profile:

```tsx
const res = await fetch("/api/agent/init", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reportData: [bloodLabReport, geneticReport, mitoReport] }),
});
const { profile, metrics, traits, greeting } = await res.json();
```

The report data format is defined in `src/lib/types.ts` — `BloodLabReport`, `GeneticReport`, `MitoScreenReport`.

## 5. API Routes Reference

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agent/init` | POST | Derive profile from health reports |
| `/api/agent/chat` | POST | Text chat with the agent |
| `/api/agent/simulate` | POST | Run a preset simulation scenario |
| `/api/agent/simulate-custom` | POST | Natural language custom simulation |
| `/api/agent/voice-session` | POST | Get WebSocket URL for voice session |
| `/api/agent/tts` | POST | Text-to-speech (fallback for text chat) |
| `/api/agent/daily-plan` | POST | Generate personalized daily plan |

## 6. Customize

### System Prompt (text chat)
Edit `src/lib/health-agent/agent.ts` → `buildSystemPrompt()`.

### Voice Prompt
Edit `src/app/api/agent/voice-session/route.ts` → `buildVoicePrompt()`.

### Product Catalog
Edit `src/lib/health-agent/product-catalog.ts` — add/remove products with Shopify URLs.

### Knowledge Base
Edit markdown files in `src/lib/health-agent/knowledge/`:
- `playbooks/` — compliance rules, product recommendations, cause-effect chains
- `traits/` — per-trait explanations and content
- Or use the admin UI at `/knowledge`

### Voice (Gemini Live API)
- Voice name: change `voiceName` in `useGeminiLive.ts` setup message
- VAD sensitivity: adjust `silenceDurationMs`, `startOfSpeechSensitivity`, `endOfSpeechSensitivity`

## 7. Production Notes

### API Key Security
The voice session route currently passes the Gemini API key to the client for the WebSocket connection. This is necessary because Next.js doesn't support WebSocket proxying. For production:

1. **Recommended**: Deploy a WebSocket proxy (e.g., via a standalone Node.js server or Cloudflare Worker) that holds the API key server-side
2. **Alternative**: Use Google OAuth instead of API keys for Gemini access
3. **Current mitigation**: Origin validation prevents cross-origin requests

### Knowledge Base Security
The knowledge API validates paths to prevent traversal attacks. For production, add authentication to the `/api/knowledge` routes.

### Session Limits
Gemini Live API audio sessions are limited to 15 minutes. The hook handles reconnection, but long conversations will need session management.
