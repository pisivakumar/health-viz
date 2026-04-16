import { NextRequest, NextResponse } from "next/server";
import { generateDailyPlan } from "@/lib/health-agent/agent";
import type { UserProfile, DerivedMetrics } from "@/lib/health-agent/types";

/**
 * POST /api/agent/daily-plan
 *
 * Generates a personalized daily plan from profile + optional mood inputs.
 *
 * Body: { profile, metrics, sleep?, stress? }
 * Response: DailyPlan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, metrics, sleep, stress } = body as {
      profile: UserProfile;
      metrics: DerivedMetrics;
      sleep?: "good" | "okay" | "bad";
      stress?: "good" | "okay" | "bad";
    };

    if (!profile || !metrics) {
      return NextResponse.json(
        { error: "Missing required fields: profile and metrics" },
        { status: 400 }
      );
    }

    const plan = generateDailyPlan(profile, metrics, sleep, stress);
    return NextResponse.json(plan);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Daily plan generation failed";
    console.error("[/api/agent/daily-plan]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
