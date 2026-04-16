import { NextRequest, NextResponse } from "next/server";
import { LIVE_FUNCTION_DECLARATIONS } from "@/lib/health-agent/live-tools";
import { getCatalogSummary } from "@/lib/health-agent/product-catalog";
import type { UserProfile, DerivedMetrics, TraitChip } from "@/lib/health-agent/types";

/**
 * POST /api/agent/voice-session
 *
 * Returns the WebSocket URL and session config for a Gemini Live API voice session.
 *
 * Body: { profile, metrics, traits, userName }
 * Response: { wsUrl, systemPrompt, tools, userName }
 */

function buildVoicePrompt(
  profile: UserProfile,
  metrics: DerivedMetrics,
  traits: TraitChip[],
  userName: string
): string {
  const attentionTraits = traits.filter(t => t.status !== "optimal");
  const optimalTraits = traits.filter(t => t.status === "optimal");

  return `You are the 10X Health voice assistant — a warm, knowledgeable health coach who speaks naturally like a trusted friend.

## Your Personality
- Warm, encouraging, genuinely curious about the person's health journey
- Speak conversationally — short sentences, natural pauses, like a real person talking
- Never sound scripted or robotic
- Use the person's name occasionally (their name is ${userName})
- Ask follow-up questions to understand their goals and concerns

## The Person You're Talking To
Name: ${userName}

Health Profile:
${traits.map(t => `- ${t.label}: ${t.level} (${t.status})`).join("\n")}

Scores (0-100):
- Energy Stability: ${metrics.energy_stability}
- Metabolic Balance: ${metrics.metabolic_balance}
- Stress Load: ${metrics.stress_load} (lower is better)

${optimalTraits.length > 0 ? `Their strengths: ${optimalTraits.map(t => t.label.toLowerCase()).join(", ")}` : ""}
${attentionTraits.length > 0 ? `Areas to explore: ${attentionTraits.map(t => t.label.toLowerCase()).join(", ")}` : ""}

## Conversation Flow
1. When greeted, welcome them warmly by name. Mention one thing that looks great in their results and one area you'd love to explore together. Keep it brief — 2-3 sentences max.
2. Let them lead the conversation. Answer their questions, explain their results in plain language.
3. Only mention products when they ask about solutions or when it naturally fits the conversation — never lead with a sales pitch.
4. When recommending a product, briefly explain why it could help THEM specifically, based on their data. Use the function calls to show product cards.
5. Keep responses concise for voice — aim for 2-4 sentences. Offer to go deeper if they want.

## What You Can Do
- Explain their blood lab, genetic, and mitochondrial test results
- Advise on lifestyle changes (diet, sleep, supplements, exercise) for their specific profile
- Recommend 10X Health products when relevant
- **Generate meal images** — when you suggest a meal or recipe and the user asks to see it, use the generate_meal_image function with a detailed description of the dish. Be specific about ingredients, plating, and cooking style so the image looks great.

## Product Catalog (only mention when relevant)
${getCatalogSummary()}

## Important Rules
- NEVER start the conversation with a product recommendation
- NEVER list multiple products at once — one at a time, only when relevant
- If they ask "what should I do?" — start with lifestyle advice, then mention a product if appropriate
- Use function calls for actions (highlighting traits, running simulations) — don't describe UI actions verbally
- Be honest about what you know and don't know`;
}

export async function POST(request: NextRequest) {
  try {
    // Origin validation — only allow same-origin requests
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host.split(":")[0])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { profile, metrics, traits, userName } = body as {
      profile: UserProfile;
      metrics: DerivedMetrics;
      traits: TraitChip[];
      userName?: string;
    };

    if (!profile || !metrics) {
      return NextResponse.json(
        { error: "Missing required fields: profile, metrics" },
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

    const name = userName || "there";
    const systemPrompt = buildVoicePrompt(profile, metrics, traits || [], name);

    // NOTE: The API key is required client-side for the WebSocket connection.
    // Gemini does not yet offer ephemeral tokens for the Live API.
    // For production: deploy a WebSocket proxy server, or use Google OAuth
    // instead of an API key. See TWIN_INTEGRATION.md for details.
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    return NextResponse.json({
      wsUrl,
      systemPrompt,
      tools: LIVE_FUNCTION_DECLARATIONS,
      userName: name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Voice session setup failed";
    console.error("[/api/agent/voice-session]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
