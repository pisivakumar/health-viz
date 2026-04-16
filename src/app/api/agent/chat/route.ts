import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/health-agent/agent";
import type { UserProfile, DerivedMetrics, TraitChip, AgentMessage } from "@/lib/health-agent/types";

/**
 * POST /api/agent/chat
 *
 * Conversational agent — sends message + context to reasoning LLM.
 *
 * Body: { message, profile, metrics, traits, conversationHistory }
 * Response: { text, actions, upsellCard? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      profile,
      metrics,
      traits,
      conversationHistory,
    } = body as {
      message: string;
      profile: UserProfile;
      metrics: DerivedMetrics;
      traits: TraitChip[];
      conversationHistory: AgentMessage[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    if (!profile || !metrics) {
      return NextResponse.json(
        { error: "Missing required fields: profile and metrics" },
        { status: 400 }
      );
    }

    const result = await chat(
      message,
      profile,
      metrics,
      traits || [],
      conversationHistory || []
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[/api/agent/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
