import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/report-store";

/**
 * GET /api/report/[id]
 *
 * Retrieves a stored health report by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stored = getReport(id);

  if (!stored) {
    return NextResponse.json(
      { error: "Report not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: stored.id,
    report: stored.report,
    createdAt: stored.createdAt,
  });
}
