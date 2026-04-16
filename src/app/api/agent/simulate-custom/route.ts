import { NextRequest, NextResponse } from "next/server";
import type { UserProfile, DerivedMetrics, TraitChip, SimulationResult } from "@/lib/health-agent/types";

/**
 * POST /api/agent/simulate-custom
 *
 * LLM-powered custom simulation — user describes a lifestyle change in natural language,
 * Gemini reasons about the impact on their health profile.
 *
 * Body: { query, profile, metrics, traits }
 * Response: SimulationResult
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, profile, metrics, traits } = body as {
      query: string;
      profile: UserProfile;
      metrics: DerivedMetrics;
      traits: TraitChip[];
    };

    if (!query || !profile || !metrics) {
      return NextResponse.json(
        { error: "Missing required fields: query, profile, metrics" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const traitSummary = (traits || [])
      .map((t: TraitChip) => `- ${t.label}: ${t.level} (${t.status})`)
      .join("\n");

    const systemPrompt = `You are a health simulation engine for 10X Health.
Given a user's health profile and a proposed lifestyle change, estimate the impact on their health metrics.

## User Profile
${JSON.stringify(profile, null, 2)}

## Current Metrics (0-100 scale)
- Energy Stability: ${metrics.energy_stability}
- Metabolic Balance: ${metrics.metabolic_balance}
- Stress Load: ${metrics.stress_load} (lower is better)

## Trait Summary
${traitSummary}

## Metric Formulas
- Energy Stability = carb_tolerance(0.4) + caffeine_sensitivity_inv(0.3) + sleep_quality(0.3)
- Metabolic Balance = fat_metabolism(0.35) + inflammation_inv(0.35) + recovery_rate(0.3)
- Stress Load = cortisol_proxy(0.4) + inflammation(0.3) + sleep_inv(0.3)

Trait level values: low=30, moderate=60, high=85, poor=30, average=55, good=85, slow=30, fast=85.

## Instructions
Estimate how the proposed change would affect the 3 metrics and 6 traits. Be realistic — most single changes produce deltas of 3-15 points, not dramatic swings. Consider the user's current profile when estimating impact (e.g., improving something already "high" yields small gains).

Return ONLY valid JSON:
{
  "delta": { "energy_stability": <int>, "metabolic_balance": <int>, "stress_load": <int> },
  "confidence": "low" | "medium" | "high",
  "explanation": "<2-3 sentences explaining the projected impact, personalized to their profile>",
  "trait_changes": { "<trait_key>": "<new_level>" }  // only traits that would change
}

trait_changes keys must be from: caffeine_sensitivity, carb_tolerance, fat_metabolism, inflammation_tendency, recovery_rate, sleep_quality_tendency.
Valid levels: low, moderate, high (or poor, average, good for sleep; slow, moderate, fast for recovery).
Deltas should be integers between -20 and +20. For stress_load, negative delta = improvement.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: `What if I ${query}` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5,
          },
        }),
      }
    );

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const parsed = JSON.parse(raw);

    const result: SimulationResult = {
      scenario: "custom",
      delta: {
        energy_stability: clamp(parsed.delta?.energy_stability ?? 0, -20, 20),
        metabolic_balance: clamp(parsed.delta?.metabolic_balance ?? 0, -20, 20),
        stress_load: clamp(parsed.delta?.stress_load ?? 0, -20, 20),
      },
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "medium",
      explanation: parsed.explanation || "Could not generate a detailed analysis for this scenario.",
      trait_changes: parsed.trait_changes || {},
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Custom simulation failed";
    console.error("[/api/agent/simulate-custom]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}
