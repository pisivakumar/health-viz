import { NextRequest, NextResponse } from "next/server";
import {
  extractReport,
  GeminiProvider,
  OpenAICompatibleProvider,
  type LLMProvider,
} from "@/lib/extract";

/**
 * POST /api/extract
 *
 * Accepts PDF text and extracts structured health report JSON.
 *
 * Body:
 *   pdfText: string        — raw text content from PDF
 *   provider?: "gemini" | "openai" | "anthropic"  — LLM provider (default: gemini)
 *   apiKey?: string         — provider API key (falls back to env vars)
 *   model?: string          — model override for openai-compatible providers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfText, provider: providerName, apiKey, model } = body;

    if (!pdfText || typeof pdfText !== "string") {
      return NextResponse.json(
        { error: "Missing required field: pdfText" },
        { status: 400 }
      );
    }

    const llmProvider = resolveProvider(providerName, apiKey, model);
    if (!llmProvider) {
      return NextResponse.json(
        {
          error:
            "No API key available. Provide apiKey in the request body or set GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY in environment.",
        },
        { status: 400 }
      );
    }

    const report = await extractReport(pdfText, llmProvider);

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[/api/extract] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function resolveProvider(
  name?: string,
  apiKey?: string,
  model?: string
): LLMProvider | null {
  const provider = name || "gemini";

  switch (provider) {
    case "gemini": {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return null;
      return new GeminiProvider(key);
    }
    case "openai": {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) return null;
      return new OpenAICompatibleProvider(
        "openai",
        key,
        "https://api.openai.com/v1",
        model || "gpt-4o-mini"
      );
    }
    case "anthropic": {
      console.warn("Anthropic provider is not yet supported. Use 'gemini' or 'openai' instead.");
      return null;
    }
    default:
      return null;
  }
}
