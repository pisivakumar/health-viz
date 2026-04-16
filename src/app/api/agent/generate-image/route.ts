import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/agent/generate-image
 *
 * Generates a meal/food image using Gemini Nano Banana 2.
 *
 * Body: { prompt, aspectRatio? }
 * Response: { imageUrl } (base64 data URL)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, aspectRatio } = body as {
      prompt: string;
      aspectRatio?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Use Nano Banana 2 for fast, affordable meal images
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a beautiful, appetizing photo-realistic image of this meal: ${prompt}.
The image should look like a professional food photograph — well-plated, good lighting, overhead or 45-degree angle. No text or labels in the image.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: aspectRatio || "1:1",
              imageSize: "1K",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[/api/agent/generate-image] Gemini error:", errorText);
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    // Find the image part
    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );

    if (!imagePart?.inlineData) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 502 }
      );
    }

    const { mimeType, data: b64 } = imagePart.inlineData;
    const imageUrl = `data:${mimeType};base64,${b64}`;

    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    console.error("[/api/agent/generate-image]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
