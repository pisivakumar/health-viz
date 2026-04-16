/**
 * PDF → Structured JSON extraction layer.
 *
 * Model-agnostic: works with Gemini, Claude, GPT, or any LLM.
 * The LLM reads the PDF text and returns structured health data.
 *
 * Flow:
 *   1. Legacy portal uploads PDF
 *   2. We extract raw text (pdftotext or pdf.js)
 *   3. We send text + schema prompt to ANY LLM
 *   4. LLM returns typed JSON matching our data model
 *   5. We validate and render the visualization
 */

import type { BloodLabReport, GeneticReport, MitoScreenReport } from "./types";
import { computeBiomarkerStatus, computeSystemScore, computeSystemStatus } from "./theme";

// ============================================================
// The prompt that turns raw PDF text into structured JSON.
// This is the "AI" part — everything else is just rendering.
// ============================================================

const BLOOD_LAB_EXTRACTION_PROMPT = `You are a medical data extraction assistant. Given raw text from a 10X Health Comprehensive Blood Test PDF, extract ALL biomarker data into the following JSON structure.

Return ONLY valid JSON, no markdown or explanation.

{
  "type": "blood-lab",
  "patient": {
    "name": "string",
    "dateOfBirth": "string",
    "gender": "string",
    "age": number,
    "testDate": "string"
  },
  "systems": [
    {
      "id": "thyroid | vitamins | lipids | blood | sugar_metabolism | liver | kidneys | hormones | prostate",
      "name": "Human readable name",
      "biomarkers": [
        {
          "name": "Biomarker name",
          "value": number,
          "unit": "unit string",
          "optimalMin": number,
          "optimalMax": number
        }
      ]
    }
  ]
}

Group biomarkers into these systems:
- thyroid: TSH, T3, Free T3, Free T4
- vitamins: Vitamin B12, Vitamin D
- lipids: Total Cholesterol, Triglycerides, HDL, VLDL, LDL
- blood: WBC, RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC, RDW, Platelets, Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils
- sugar_metabolism: Glucose, HbA1c, Insulin
- liver: Total Protein, Albumin, Globulin, Bilirubin, ALP, AST, ALT
- kidneys: BUN, Creatinine, eGFR, Sodium, Potassium, Chloride, CO2, Calcium
- hormones: Cortisol, IGF-1, Testosterone, Free Testosterone, LH, FSH, DHEA-Sulfate, SHBG, Estradiol
- prostate: PSA, Free PSA

Use the "Optimal" column values for optimalMin and optimalMax. Extract the actual numeric "Result" for value.`;

const GENETIC_EXTRACTION_PROMPT = `You are a genetic data extraction assistant. Given raw text from a 10X Health Genetic Methylation Test PDF, extract all gene variant data into JSON.

Return ONLY valid JSON:

{
  "type": "genetic",
  "patient": { "name": "string", "dateOfBirth": "string", "testDate": "string" },
  "genes": [
    {
      "id": "mthfr | mtr | mtrr | ahcy | comt",
      "name": "GENE_NAME",
      "affectedBodyPart": "Mind | Lower Gut | Upper Gut | Mind and Gut",
      "symptoms": ["symptom1", "symptom2"],
      "variants": [
        {
          "subAllele": "e.g. C677T",
          "result": "Homozygous Negative | Heterozygous | Homozygous Positive",
          "variantCount": 0 | 1 | 2,
          "description": "brief description"
        }
      ],
      "enzymeActivity": "normal | reduced | significantly-reduced",
      "description": "gene description from report"
    }
  ],
  "supplementProtocol": "protocol description"
}

Map variant results: Homozygous Negative = 0 variants, Heterozygous = 1 variant, Homozygous Positive = 2 variants.`;

const MITO_EXTRACTION_PROMPT = `You are a mitochondrial health data extraction assistant. Given raw text from a 10X Health MitoScreen PDF, extract all metrics.

Return ONLY valid JSON:

{
  "type": "mitoscreen",
  "patient": { "name": "string", "testDate": "string" },
  "mitoScore": number (0-100 percentile),
  "profileType": "string (e.g. High Function with Growth Potential)",
  "energyProfile": [
    { "name": "metric name", "rating": "optimal|stable|borderline|compromised|critical", "score": number, "description": "string" }
  ],
  "energyBalance": [...same format...],
  "mitoROS": [...same format...],
  "mitoNetwork": [...same format...]
}`;

// ============================================================
// LLM Provider Interface (model-agnostic)
// ============================================================

export interface LLMProvider {
  name: string;
  extract(prompt: string, pdfText: string): Promise<string>;
}

/**
 * Google Gemini provider (cheapest for PDF extraction)
 */
export class GeminiProvider implements LLMProvider {
  name = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(prompt: string, pdfText: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt + "\n\n--- RAW PDF TEXT ---\n\n" + pdfText },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

/**
 * OpenAI/Claude/any OpenAI-compatible provider
 */
export class OpenAICompatibleProvider implements LLMProvider {
  name: string;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(
    name: string,
    apiKey: string,
    baseUrl: string,
    model: string
  ) {
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async extract(prompt: string, pdfText: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: "Extract data from this report:\n\n" + pdfText,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

// ============================================================
// Main extraction function
// ============================================================

export type ReportType = "blood-lab" | "genetic" | "mitoscreen";

function detectReportType(pdfText: string): ReportType {
  const lower = pdfText.toLowerCase();
  if (lower.includes("comprehensive blood test") || lower.includes("biomarker"))
    return "blood-lab";
  if (lower.includes("methylation") || lower.includes("mthfr"))
    return "genetic";
  if (lower.includes("mitoscreen") || lower.includes("mitoscore"))
    return "mitoscreen";
  return "blood-lab"; // default
}

function getPromptForType(type: ReportType): string {
  switch (type) {
    case "blood-lab":
      return BLOOD_LAB_EXTRACTION_PROMPT;
    case "genetic":
      return GENETIC_EXTRACTION_PROMPT;
    case "mitoscreen":
      return MITO_EXTRACTION_PROMPT;
  }
}

export async function extractReport(
  pdfText: string,
  provider: LLMProvider
): Promise<BloodLabReport | GeneticReport | MitoScreenReport> {
  const reportType = detectReportType(pdfText);
  const prompt = getPromptForType(reportType);

  console.log(
    `[extract] Detected report type: ${reportType}, using provider: ${provider.name}`
  );

  const jsonStr = await provider.extract(prompt, pdfText);

  // Parse and add computed fields
  const data = JSON.parse(jsonStr);

  if (reportType === "blood-lab") {
    // Add computed status and scores
    for (const system of data.systems) {
      for (const b of system.biomarkers) {
        b.status = computeBiomarkerStatus(b.value, b.optimalMin, b.optimalMax);
      }
      system.score = computeSystemScore(system.biomarkers);
      system.overallStatus = computeSystemStatus(system.score);
    }
  }

  return data;
}
