import { NextResponse } from "next/server";
import { listKnowledgeFiles } from "@/lib/health-agent/knowledge-loader";

/**
 * GET /api/knowledge — list all knowledge files.
 */
export async function GET() {
  try {
    const files = listKnowledgeFiles();
    return NextResponse.json({ files });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
