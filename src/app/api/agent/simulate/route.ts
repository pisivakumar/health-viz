import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/health-agent/agent";
import type { UserProfile, DerivedMetrics, ScenarioId } from "@/lib/health-agent/types";

/**
 * POST /api/agent/simulate
 *
 * Rule-based simulation — no LLM call.
 *
 * Body: { scenario, profile, metrics }
 * Response: SimulationResult
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario, profile, metrics } = body as {
      scenario: ScenarioId;
      profile: UserProfile;
      metrics: DerivedMetrics;
    };

    if (!scenario || !profile || !metrics) {
      return NextResponse.json(
        { error: "Missing required fields: scenario, profile, metrics" },
        { status: 400 }
      );
    }

    const validScenarios: ScenarioId[] = [
      "reduce_caffeine", "high_protein", "intermittent_fasting",
      "increase_sleep", "high_carb",
    ];
    if (!validScenarios.includes(scenario)) {
      return NextResponse.json(
        { error: `Invalid scenario. Must be one of: ${validScenarios.join(", ")}` },
        { status: 400 }
      );
    }

    const result = runSimulation(scenario, profile, metrics);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Simulation failed";
    console.error("[/api/agent/simulate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
