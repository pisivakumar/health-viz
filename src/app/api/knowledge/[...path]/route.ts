import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { writeKnowledgeFile, clearCache } from "@/lib/health-agent/knowledge-loader";

const KNOWLEDGE_DIR = resolve(join(process.cwd(), "src/lib/health-agent/knowledge"));

/** Validate that a relative path stays within KNOWLEDGE_DIR and is in an allowed subdirectory. */
function validateKnowledgePath(relativePath: string): string | null {
  if (relativePath.includes("..")) return "Invalid path";
  if (!relativePath.startsWith("traits/") && !relativePath.startsWith("playbooks/")) return "Access denied";
  const full = resolve(join(KNOWLEDGE_DIR, relativePath));
  if (!full.startsWith(KNOWLEDGE_DIR)) return "Access denied";
  return null; // valid
}

/**
 * GET /api/knowledge/[...path] — read a knowledge file.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const relativePath = segments.join("/");

    const pathError = validateKnowledgePath(relativePath);
    if (pathError) return NextResponse.json({ error: pathError }, { status: 403 });

    const fullPath = resolve(join(KNOWLEDGE_DIR, relativePath));
    const content = readFileSync(fullPath, "utf-8");
    return NextResponse.json({ path: relativePath, content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read file";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

/**
 * PUT /api/knowledge/[...path] — save a knowledge file.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const relativePath = segments.join("/");

    const pathError = validateKnowledgePath(relativePath);
    if (pathError) return NextResponse.json({ error: pathError }, { status: 403 });

    const body = await request.json();
    const { content } = body as { content: string };

    if (typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    writeKnowledgeFile(relativePath, content);
    clearCache();

    return NextResponse.json({ success: true, path: relativePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
