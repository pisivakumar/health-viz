"use client";

/**
 * useGeminiLive — React hook for bidirectional voice via Gemini 3.1 Flash Live API.
 *
 * Manages: WebSocket connection, mic capture (AudioWorklet → PCM 16kHz),
 * audio playback (PCM 24kHz → AudioContext), transcription, and function calls.
 */

import { useRef, useCallback, useEffect } from "react";
import type { UserProfile, DerivedMetrics, TraitChip, VoiceState } from "@/lib/health-agent/types";

// ── Types ──

interface UseGeminiLiveOptions {
  profile: UserProfile;
  metrics: DerivedMetrics;
  traits: TraitChip[];
  userName?: string;
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string, role: "user" | "assistant", isFinal: boolean) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
  onImageGenerated: (imageUrl: string, description: string) => void;
  onError: (error: string) => void;
  onMicLevel?: (level: number) => void; // 0-1, for UI meter
}

interface UseGeminiLiveReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
  muteMic: () => void;
  unmuteMic: () => void;
}

// ── Helpers ──

function int16ToBase64(pcmBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(pcmBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

// ── Hook ──

export function useGeminiLive(options: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackTimeRef = useRef(0);
  const playbackGainRef = useRef<GainNode | null>(null);
  const isConnectedRef = useRef(false);

  // Store latest options in ref to avoid stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cleanup = useCallback(() => {
    // Stop mic polling + reader
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    readerRef.current?.cancel().catch(() => {});
    readerRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => {});
    }
    audioContextRef.current = null;

    playbackTimeRef.current = 0;
    isConnectedRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const connect = useCallback(async () => {
    const opts = optionsRef.current;
    opts.onStateChange("connecting");

    try {
      // 1. Get session config from server
      const res = await fetch("/api/agent/voice-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: opts.profile,
          metrics: opts.metrics,
          traits: opts.traits,
          userName: opts.userName,
        }),
      });

      if (!res.ok) throw new Error("Failed to get voice session config");
      const { wsUrl, systemPrompt, tools } = await res.json();

      // 2. Open WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send setup message
        ws.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Kore" },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              tools: [{ functionDeclarations: tools }],
              realtimeInputConfig: {
                automaticActivityDetection: {
                  disabled: false,
                  startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
                  endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
                  silenceDurationMs: 1000,
                },
              },
            },
          })
        );
      };

      ws.onmessage = async (event) => {
        try {
          // WebSocket messages may arrive as Blob or string
          const raw = event.data instanceof Blob ? await event.data.text() : event.data;
          const msg = JSON.parse(raw);

          // Setup complete
          if (msg.setupComplete) {
            isConnectedRef.current = true;
            optionsRef.current.onStateChange("listening");
            startMic();

            // Trigger a personalized greeting from the model
            ws.send(
              JSON.stringify({
                realtimeInput: { text: "Hi, I just connected. Please greet me briefly." },
              })
            );
            return;
          }

          // Server content (audio + transcriptions)
          const sc = msg.serverContent;
          if (sc) {
            // Audio data
            if (sc.modelTurn?.parts) {
              for (const part of sc.modelTurn.parts) {
                if (part.inlineData?.data) {
                  optionsRef.current.onStateChange("speaking");
                  playAudioChunk(part.inlineData.data);
                }
              }
            }

            // Output transcription
            if (sc.outputTranscription?.text) {
              optionsRef.current.onTranscript(
                sc.outputTranscription.text,
                "assistant",
                !!sc.turnComplete
              );
            }

            // Input transcription
            if (sc.inputTranscription?.text) {
              optionsRef.current.onTranscript(
                sc.inputTranscription.text,
                "user",
                true
              );
            }

            // Turn complete → back to listening
            if (sc.turnComplete) {
              optionsRef.current.onStateChange("listening");
            }

            // Interrupted (user barged in) — stop queued audio immediately
            if (sc.interrupted) {
              if (playbackGainRef.current) {
                playbackGainRef.current.disconnect();
                playbackGainRef.current = null;
              }
              playbackTimeRef.current = 0;
              optionsRef.current.onStateChange("listening");
            }
          }

          // Tool call
          if (msg.toolCall) {
            for (const fc of msg.toolCall.functionCalls || []) {
              if (fc.name === "generate_meal_image") {
                const desc = (fc.args?.description as string) || "healthy meal";

                // Respond IMMEDIATELY so the agent keeps talking while image generates
                ws.send(
                  JSON.stringify({
                    toolResponse: {
                      functionResponses: [
                        {
                          id: fc.id,
                          name: fc.name,
                          response: {
                            result:
                              "Image is being generated and will appear in a moment. Continue talking to the user — describe the meal while they wait.",
                          },
                        },
                      ],
                    },
                  })
                );

                // Generate image in background
                fetch("/api/agent/generate-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: desc }),
                })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data.imageUrl) {
                      optionsRef.current.onImageGenerated(data.imageUrl, desc);
                    }
                  })
                  .catch(() => {});
              } else {
                optionsRef.current.onToolCall(fc.name, fc.args || {});

                // Send tool response (acknowledge)
                ws.send(
                  JSON.stringify({
                    toolResponse: {
                      functionResponses: [
                        {
                          id: fc.id,
                          name: fc.name,
                          response: { result: "ok" },
                        },
                      ],
                    },
                  })
                );
              }
            }
          }
        } catch (err) {
          console.warn("[useGeminiLive] Message parse error:", err);
        }
      };

      ws.onerror = () => {
        optionsRef.current.onError("Voice connection error");
        optionsRef.current.onStateChange("error");
        cleanup();
      };

      ws.onclose = () => {
        if (isConnectedRef.current) {
          optionsRef.current.onStateChange("idle");
        }
        cleanup();
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      opts.onError(msg);
      opts.onStateChange("error");
      cleanup();
    }
  }, [cleanup]);

  // ── Mic capture ──

  const micIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Set up AudioContext + AnalyserNode just for the mic level meter
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      source.connect(silentGain);
      silentGain.connect(ctx.destination);

      const levelBuf = new Float32Array(analyser.fftSize);
      micIntervalRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(levelBuf);
        let peak = 0;
        for (let i = 0; i < levelBuf.length; i++) {
          const abs = Math.abs(levelBuf[i]);
          if (abs > peak) peak = abs;
        }
        optionsRef.current.onMicLevel?.(peak);
      }, 100);

      // Use MediaStreamTrackProcessor for sequential, non-overlapping audio frames
      const track = stream.getAudioTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trackProcessor = new (globalThis as any).MediaStreamTrackProcessor({ track });
      const reader = trackProcessor.readable.getReader();
      readerRef.current = reader;

      const targetRate = 16000;

      // Read audio frames in a loop
      const readLoop = async () => {
        try {
          while (true) {
            const { value: audioData, done } = await reader.read();
            if (done) break;

            const numFrames = audioData.numberOfFrames;
            const srcRate = audioData.sampleRate;
            const float32 = new Float32Array(numFrames);
            audioData.copyTo(float32, { planeIndex: 0 });
            audioData.close();

            // Resample to 16kHz
            const ratio = srcRate / targetRate;
            const outLen = Math.floor(numFrames / ratio);
            const int16 = new Int16Array(outLen);
            for (let i = 0; i < outLen; i++) {
              const srcIdx = i * ratio;
              const lo = Math.floor(srcIdx);
              const hi = Math.min(lo + 1, numFrames - 1);
              const frac = srcIdx - lo;
              const sample = float32[lo] * (1 - frac) + float32[hi] * frac;
              int16[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
            }

            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  realtimeInput: {
                    audio: {
                      data: int16ToBase64(int16.buffer),
                      mimeType: "audio/pcm;rate=16000",
                    },
                  },
                })
              );
            }
          }
        } catch {
          // Reader cancelled on disconnect — expected
        }
      };
      readLoop();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      optionsRef.current.onError(msg);
      optionsRef.current.onStateChange("error");
    }
  }, []);

  // ── Audio playback ──

  const playAudioChunk = useCallback((b64Data: string) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Ensure we have a gain node for this turn (disconnected on interrupt)
    if (!playbackGainRef.current) {
      const gain = ctx.createGain();
      gain.gain.value = 1;
      gain.connect(ctx.destination);
      playbackGainRef.current = gain;
    }

    const pcm16 = base64ToInt16(b64Data);

    // Convert int16 → float32 for Web Audio API
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    // Create audio buffer at 24kHz (Gemini output rate)
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(playbackGainRef.current);

    // Schedule seamless playback
    const now = ctx.currentTime;
    const startTime = Math.max(now, playbackTimeRef.current);
    source.start(startTime);
    playbackTimeRef.current = startTime + buffer.duration;
  }, []);

  const sendText = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({ realtimeInput: { text } })
    );
  }, []);

  const disconnect = useCallback(() => {
    // Send end-of-audio signal before closing
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
    }
    cleanup();
    optionsRef.current.onStateChange("idle");
  }, [cleanup]);

  const muteMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
  }, []);

  const unmuteMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = true; });
  }, []);

  return { connect, disconnect, sendText, muteMic, unmuteMic };
}
