import { NextRequest, NextResponse } from "next/server";
import { initAnalysis } from "@/lib/health-agent/agent";
import type { HealthReport } from "@/lib/types";

/**
 * POST /api/agent/init
 *
 * Derives a simplified 6-trait profile + 3 metrics from health reports.
 *
 * Body: { reportData: HealthReport[] }
 * Response: { profile, metrics, traits, greeting }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData } = body as { reportData: HealthReport[] };

    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: reportData (array of HealthReport)" },
        { status: 400 }
      );
    }

    const result = await initAnalysis(reportData);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Init failed";
    console.error("[/api/agent/init]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
