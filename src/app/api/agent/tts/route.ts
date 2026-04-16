import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/agent/tts
 *
 * Text-to-speech via Gemini 3.1 Flash TTS.
 * Gemini returns raw PCM (audio/l16, 24kHz, mono, 16-bit LE).
 * We wrap it in a WAV header so browsers can play it natively.
 *
 * Body: { text, voice? }
 * Response: audio/wav
 */

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // subchunk1 size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice } = body as { text: string; voice?: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Clean text for speech — remove markdown and action markers
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: cleanText }],
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || "Kore",
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/agent/tts] Gemini error:", errorText);
      return NextResponse.json(
        { error: "TTS generation failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const audioData = inlineData?.data;

    if (!audioData) {
      return NextResponse.json(
        { error: "No audio data returned from TTS" },
        { status: 502 }
      );
    }

    const pcmBuffer = Buffer.from(audioData, "base64");

    // Parse sample rate from mimeType (e.g. "audio/l16; rate=24000; channels=1")
    const mimeType: string = inlineData.mimeType || "";
    const rateMatch = mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

    // Wrap raw PCM in a WAV header for browser playback
    const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);

    return new NextResponse(new Uint8Array(wavBuffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wavBuffer.length),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "TTS failed";
    console.error("[/api/agent/tts]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
