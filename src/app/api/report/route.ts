import { NextRequest, NextResponse } from "next/server";
import { saveReport } from "@/lib/report-store";
import type { HealthReport } from "@/lib/types";

/**
 * POST /api/report
 *
 * Stores a processed health report and returns an embed URL.
 *
 * Body:
 *   report: HealthReport — the structured report JSON (blood-lab, genetic, or mitoscreen)
 *
 * Returns:
 *   { id, embedUrl, iframeHtml }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { report } = body as { report: HealthReport };

    if (!report || !report.type) {
      return NextResponse.json(
        { error: "Missing required field: report (must include type)" },
        { status: 400 }
      );
    }

    const validTypes = ["blood-lab", "genetic", "mitoscreen"];
    if (!validTypes.includes(report.type)) {
      return NextResponse.json(
        { error: `Invalid report type: ${report.type}. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const stored = saveReport(report);

    const origin = request.nextUrl.origin;
    const embedUrl = `${origin}/embed/${stored.id}`;
    const iframeHtml = `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border-radius:16px;border:1px solid rgba(255,255,255,0.06)"></iframe>`;

    return NextResponse.json({
      success: true,
      id: stored.id,
      embedUrl,
      iframeHtml,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to store report";
    console.error("[/api/report] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
