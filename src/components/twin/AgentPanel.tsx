"use client";

/**
 * AgentPanel — Persistent side chat panel for the Health Twin agent.
 * Light theme — matches the existing 10X Health dashboard.
 *
 * Voice mode uses Gemini 3.1 Flash Live API (WebSocket) for real-time bidirectional audio.
 * Text mode uses the REST /api/agent/chat endpoint.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type {
  UserProfile,
  DerivedMetrics,
  TraitChip,
  AgentMessage,
  AgentAction,
  ScenarioId,
  VoiceState,
} from "@/lib/health-agent/types";
import UpsellCard from "./UpsellCard";
import { getProduct } from "@/lib/health-agent/product-catalog";
import type { UpsellCardData } from "@/lib/health-agent/types";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";

/** Resolve a productId from the catalog, enriching the card with url/price. */
function resolveUpsellCard(card: UpsellCardData): UpsellCardData {
  if (!card.productId) return card;
  const product = getProduct(card.productId);
  if (!product) return card;
  return {
    ...card,
    product: product.name,
    description: card.description || product.tagline,
    price: card.price || product.price,
    url: product.url,
    imageUrl: product.imageUrl,
    cta: product.category === "consultation" ? "talk_to_concierge" : "buy_now",
  };
}

interface AgentPanelProps {
  profile: UserProfile;
  metrics: DerivedMetrics;
  traits: TraitChip[];
  userName?: string;
  messages: AgentMessage[];
  onMessagesChange: (messages: AgentMessage[]) => void;
  onHighlightTrait: (traitId: string) => void;
  onRunSimulation: (scenario: ScenarioId) => void;
  onAddToCart: (item: string) => void;
  onOpenConcierge?: () => void;
  onShowDailyPlan?: () => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentPanel({
  profile,
  metrics,
  traits,
  userName,
  messages,
  onMessagesChange,
  onHighlightTrait,
  onRunSimulation,
  onAddToCart,
  onOpenConcierge,
  onShowDailyPlan,
  voiceEnabled,
  onVoiceToggle,
  isOpen,
  onClose,
}: AgentPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Accumulator for streaming transcripts
  const pendingTranscriptRef = useRef<{ role: "user" | "assistant"; text: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Refs for async callbacks (image generation, voice transcripts)
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  const VALID_SCENARIOS = ["reduce_caffeine", "high_protein", "intermittent_fasting", "increase_sleep", "high_carb"];

  const processActions = useCallback(
    (actions: AgentAction[]) => {
      for (const action of actions) {
        try {
          const p = action.payload || {};
          switch (action.type) {
            case "highlight_node": {
              const traitId = (p.traitId || p.node_id || p.trait) as string;
              if (traitId) onHighlightTrait(traitId);
              break;
            }
            case "run_simulation": {
              const scenario = (p.scenario || p.scenarioId) as string;
              if (scenario && VALID_SCENARIOS.includes(scenario)) {
                onRunSimulation(scenario as ScenarioId);
              }
              break;
            }
            case "add_to_cart": {
              const title = (p.title || p.product || p.name) as string;
              if (title) onAddToCart(title);
              break;
            }
            case "open_concierge":
              onOpenConcierge?.();
              break;
            case "show_daily_plan":
              onShowDailyPlan?.();
              break;
            case "generate_meal_image": {
              const desc = (p.description || p.prompt || "") as string;
              if (desc) {
                fetch("/api/agent/generate-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: desc }),
                })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.imageUrl) {
                      // Attach image to the last assistant message instead of creating a new one
                      const msgs = [...messagesRef.current];
                      const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
                      if (lastAssistant) {
                        lastAssistant.imageUrl = data.imageUrl;
                        onMessagesChangeRef.current([...msgs]);
                      }
                    }
                  })
                  .catch(() => {});
              }
              break;
            }
          }
        } catch (err) {
          console.warn("Skipping invalid agent action:", action, err);
        }
      }
    },
    [onHighlightTrait, onRunSimulation, onAddToCart, onOpenConcierge, onShowDailyPlan]
  );

  // ── Text chat (REST API) ──

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    const userMessage: AgentMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          profile,
          metrics,
          traits,
          conversationHistory: updatedMessages,
        }),
      });

      const data = await res.json();

      const assistantMessage: AgentMessage = {
        role: "assistant",
        content: data.text || "I'm not sure how to respond to that.",
        actions: data.actions || [],
        upsellCard: data.upsellCard || undefined,
        timestamp: Date.now(),
      };

      onMessagesChange([...updatedMessages, assistantMessage]);

      if (data.actions?.length) processActions(data.actions);

      if (voiceEnabled && data.text) {
        playTTS(data.text);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: AgentMessage = {
        role: "assistant",
        content: "Sorry, I had trouble processing that. Could you try again?",
        actions: [],
        timestamp: Date.now(),
      };
      onMessagesChange([...updatedMessages, errorMessage]);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, profile, metrics, traits, onMessagesChange, processActions, voiceEnabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Gemini Live API voice ──

  const handleTranscript = useCallback(
    (text: string, role: "user" | "assistant", isFinal: boolean) => {
      const pending = pendingTranscriptRef.current;

      if (pending && pending.role === role) {
        // Append to existing pending transcript
        pending.text += text;
      } else {
        // Flush previous pending transcript as a message
        if (pending && pending.text.trim()) {
          const msg: AgentMessage = {
            role: pending.role,
            content: pending.text.trim(),
            timestamp: Date.now(),
          };
          onMessagesChangeRef.current([...messagesRef.current, msg]);
        }
        // Start new pending transcript
        pendingTranscriptRef.current = { role, text };
      }

      if (isFinal && pendingTranscriptRef.current) {
        const finalText = pendingTranscriptRef.current.text.trim();
        if (finalText) {
          const msg: AgentMessage = {
            role: pendingTranscriptRef.current.role,
            content: finalText,
            timestamp: Date.now(),
          };
          onMessagesChangeRef.current([...messagesRef.current, msg]);
        }
        pendingTranscriptRef.current = null;
      }
    },
    []
  );

  const handleToolCall = useCallback(
    (name: string, args: Record<string, unknown>) => {
      processActions([{ type: name as AgentAction["type"], payload: args }]);
    },
    [processActions]
  );

  const handleVoiceError = useCallback((error: string) => {
    setVoiceError(error);
    setTimeout(() => setVoiceError(null), 3000);
  }, []);

  const handleImageGenerated = useCallback(
    (imageUrl: string, _description: string) => {
      // Attach image to the last assistant message
      const msgs = [...messagesRef.current];
      const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        lastAssistant.imageUrl = imageUrl;
        onMessagesChangeRef.current([...msgs]);
      }
    },
    []
  );

  const [micMuted, setMicMuted] = useState(false);
  const isVoiceActive = voiceState === "listening" || voiceState === "speaking" || voiceState === "connecting";

  const { connect, disconnect, sendText: sendVoiceText, muteMic, unmuteMic } = useGeminiLive({
    profile,
    metrics,
    traits,
    userName,
    onStateChange: setVoiceState,
    onTranscript: handleTranscript,
    onToolCall: handleToolCall,
    onImageGenerated: handleImageGenerated,
    onError: handleVoiceError,
    onMicLevel: setMicLevel,
  });

  const handleMicToggle = useCallback(() => {
    if (isVoiceActive) {
      // Toggle mute — keep session alive
      if (micMuted) {
        unmuteMic();
        setMicMuted(false);
      } else {
        muteMic();
        setMicMuted(true);
      }
    } else {
      // Start new voice session (also recovers from error state)
      setVoiceError(null);
      setVoiceState("idle");
      setMicMuted(false);
      connect();
    }
  }, [isVoiceActive, micMuted, connect, muteMic, unmuteMic]);

  const handleVoiceEnd = useCallback(() => {
    disconnect();
    setMicMuted(false);
  }, [disconnect]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-[340px] bg-white border-l border-black/[0.08] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-7 rounded-full flex items-center justify-center text-[9px] bg-tenx-red text-white font-bold tracking-tight">
            10X
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Health Agent</p>
            <p className="text-[10px] text-muted-foreground">Powered by 10X Health</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onVoiceToggle}
            className={`p-1.5 rounded-lg transition-colors text-sm ${voiceEnabled ? "bg-tenx-red/10 text-tenx-red" : "text-muted-foreground"}`}
            title={voiceEnabled ? "Voice on" : "Voice off"}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
      </div>

      {/* Trait chips strip */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide shrink-0 border-b border-black/[0.06]">
        {traits.map((t) => (
          <span
            key={t.id}
            className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full capitalize ${
              t.status === "optimal"
                ? "bg-green-500/10 text-green-700"
                : t.status === "moderate"
                ? "bg-yellow-500/10 text-yellow-700"
                : "bg-tenx-red/10 text-tenx-red"
            }`}
          >
            {t.label.split(" ")[0]}: {t.level}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <MessageBubble message={msg} />
            {msg.upsellCard && (
              <UpsellCard
                card={resolveUpsellCard(msg.upsellCard)}
                onTalkToConcierge={onOpenConcierge}
              />
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-1.5 px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-3 border-t border-black/[0.06]">
        {/* Voice state indicators */}
        {voiceState === "connecting" && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-tenx-red/10 text-tenx-red text-xs font-medium">
            <span className="w-3 h-3 border-2 border-tenx-red/40 border-t-tenx-red rounded-full animate-spin" />
            Connecting voice...
          </div>
        )}
        {voiceState === "listening" && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-tenx-red/10 text-tenx-red text-xs font-medium">
            {micMuted ? (
              <>
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="flex-1 text-muted-foreground">Mic muted — tap mic to unmute</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tenx-red opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tenx-red" />
                </span>
                <span className="flex-1">Listening... tap mic to mute</span>
                <span className="flex items-center gap-px h-3">
                  {[0.05, 0.1, 0.2, 0.35, 0.5].map((threshold, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        micLevel > threshold ? "bg-tenx-red" : "bg-tenx-red/20"
                      }`}
                      style={{ height: `${40 + i * 15}%` }}
                    />
                  ))}
                </span>
              </>
            )}
          </div>
        )}
        {voiceState === "speaking" && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-tenx-red/10 text-tenx-red text-xs font-medium">
            <span className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-tenx-red rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
              <span className="w-0.5 bg-tenx-red rounded-full animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
              <span className="w-0.5 bg-tenx-red rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
              <span className="w-0.5 bg-tenx-red rounded-full animate-pulse" style={{ height: "80%", animationDelay: "100ms" }} />
            </span>
            Speaking...
          </div>
        )}
        {(voiceState === "error" || voiceError) && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-yellow-500/10 text-yellow-700 text-xs font-medium">
            {voiceError || "Voice unavailable — check browser permissions"}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-[10px] px-3 py-2 bg-black/[0.03] border border-black/[0.06]">
          {/* Mic button — starts session or toggles mute */}
          <button
            onClick={handleMicToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              isVoiceActive && !micMuted
                ? "bg-tenx-red/15 text-tenx-red"
                : isVoiceActive && micMuted
                ? "bg-black/[0.06] text-muted-foreground"
                : voiceState === "error"
                ? "text-yellow-500 opacity-60"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={isVoiceActive ? (micMuted ? "Unmute mic" : "Mute mic") : voiceState === "error" ? "Voice unavailable" : "Start voice"}
          >
            {isVoiceActive && micMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="2" x2="22" y1="2" y2="22" />
                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                <path d="M5 10v2a7 7 0 0 0 12 5" />
                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>
          {/* End voice session button */}
          {isVoiceActive && (
            <button
              onClick={handleVoiceEnd}
              className="p-1.5 rounded-lg text-xs text-muted-foreground hover:text-tenx-red transition-colors"
              title="End voice session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (isVoiceActive && input.trim()) {
                  // Send text through the Live API voice session
                  sendVoiceText(input.trim());
                  onMessagesChange([...messages, { role: "user", content: input.trim(), timestamp: Date.now() }]);
                  setInput("");
                } else {
                  handleSend();
                }
              }
            }}
            placeholder={isVoiceActive ? "Type here or speak..." : "Ask about your health..."}
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            disabled={sending}
          />
          <button
            onClick={() => {
              if (isVoiceActive && input.trim()) {
                sendVoiceText(input.trim());
                onMessagesChange([...messages, { role: "user", content: input.trim(), timestamp: Date.now() }]);
                setInput("");
              } else {
                handleSend();
              }
            }}
            disabled={sending || !input.trim()}
            className="p-1.5 rounded-lg bg-tenx-red text-white transition-opacity disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
          {isVoiceActive
            ? "Voice active — speak or type to get audio responses"
            : voiceEnabled
            ? "🔊 Voice responses on"
            : "Type or tap the mic to speak"}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? "bg-tenx-red/10 text-foreground rounded-br-sm"
            : "bg-black/[0.03] text-muted-foreground rounded-bl-sm"
        }`}
      >
        {message.content}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt={message.content}
            className="mt-2 rounded-lg w-full max-w-[250px]"
          />
        )}
      </div>
    </div>
  );
}

async function playTTS(text: string) {
  try {
    const res = await fetch("/api/agent/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    // TTS is best-effort
  }
}
