"use client";

/**
 * VoiceMode — Speech input using Web Speech API.
 *
 * Provides a hook for voice input that integrates with the AgentPanel.
 * TTS output is handled directly in AgentPanel via the /api/agent/tts endpoint.
 *
 * States: idle → listening → processing
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { VoiceState } from "@/lib/health-agent/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

interface UseVoiceInputReturn {
  voiceState: VoiceState;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  isSupported: boolean;
}

/**
 * Hook for voice input using Web Speech API.
 */
export function useVoiceInput(onTranscript?: (text: string) => void): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);

  // Check support on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setVoiceState("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setTranscript(text);
      setVoiceState("processing");
      onTranscript?.(text);
    };

    recognition.onerror = () => {
      setVoiceState("idle");
    };

    recognition.onend = () => {
      if (voiceState === "listening") setVoiceState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, voiceState]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState("idle");
  }, []);

  return { voiceState, startListening, stopListening, transcript, isSupported };
}

// ── Voice indicator UI ──

interface VoiceIndicatorProps {
  state: VoiceState;
  onStartListening: () => void;
  onStopListening: () => void;
}

export function VoiceIndicator({ state, onStartListening, onStopListening }: VoiceIndicatorProps) {
  return (
    <button
      onClick={state === "listening" ? onStopListening : onStartListening}
      className="p-2 rounded-full transition-all"
      style={{
        backgroundColor:
          state === "listening"
            ? "rgba(209,36,42,0.2)"
            : state === "processing"
            ? "rgba(234,179,8,0.15)"
            : "transparent",
        color:
          state === "listening"
            ? "var(--twin-accent)"
            : "var(--twin-text-muted)",
      }}
    >
      {state === "listening" ? (
        // Pulsing mic
        <span className="relative flex items-center justify-center w-5 h-5">
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: "var(--twin-accent)", opacity: 0.3 }}
          />
          <MicIcon />
        </span>
      ) : state === "processing" ? (
        <span className="w-5 h-5 flex items-center justify-center">
          <span
            className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#eab308", borderTopColor: "transparent" }}
          />
        </span>
      ) : (
        <MicIcon />
      )}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

