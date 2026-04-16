/**
 * Thin Agent Orchestration Layer.
 *
 * Coordinates LLM calls, simulation, and daily plan generation.
 * Domain knowledge lives in knowledge/ markdown files (fat skills).
 * This layer is just plumbing.
 */

import type {
  UserProfile,
  DerivedMetrics,
  TraitChip,
  TraitStatus,
  AgentMessage,
  AgentResponse,
  InitResponse,
  DailyPlan,
  ScenarioId,
  SimulationResult,
} from "./types";
import type { HealthReport, BloodLabReport, GeneticReport, MitoScreenReport } from "../types";
import { simulate, computeMetrics } from "./simulation-rules";
import { TOOL_DESCRIPTIONS } from "./tools";
import { getCatalogSummary } from "./product-catalog";
import { loadAllTraits, loadPlaybooks, type TraitMeta } from "./knowledge-loader";

// ── LLM Provider (reuses extract.ts pattern) ──

interface LLMCallOptions {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
}

async function callLLM(options: LLMCallOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemPrompt }] },
        contents: [{ parts: [{ text: options.userMessage }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: options.temperature ?? 0.7,
        },
      }),
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

// ── System Prompt Builder ──

export function buildSystemPrompt(profile: UserProfile, metrics: DerivedMetrics, traits: TraitChip[]): string {
  // Load playbooks on demand from markdown files
  const compliance = loadPlaybooks(["compliance"]);
  const causeEffects = loadPlaybooks(["cause-effects"]);
  const productRecs = loadPlaybooks(["product-recommendations"]);

  // Load trait knowledge for traits that need attention
  const attentionTraits = traits.filter(t => t.status !== "optimal");
  const traitKnowledge = attentionTraits.length > 0
    ? loadAllTraits()
        .filter(t => attentionTraits.some(at => at.id === t.id))
        .map(t => t.fullContent)
        .join("\n\n---\n\n")
    : "";

  const catalogSummary = getCatalogSummary();

  return `You are the 10X Health Wellness Agent — warm, knowledgeable, encouraging.

## User Profile
${JSON.stringify(profile, null, 2)}

## Derived Metrics
- Energy Stability: ${metrics.energy_stability}/100
- Metabolic Balance: ${metrics.metabolic_balance}/100
- Stress Load: ${metrics.stress_load}/100

## Trait Summary
${traits.map(t => `- ${t.label}: ${t.level} (${t.status})`).join("\n")}

${compliance}

## Response Format
Return JSON: { "text": "...", "actions": [...], "upsellCard": { ... } | null }
- text: conversational response (2-4 sentences). Mention product name and price naturally when recommending.
- actions: array of { "type": "action_name", "payload": { ... } }
- upsellCard: optional { "productId": "catalog-id", "product": "Product Name", "description": "why it helps", "price": "$XX.XX", "cta": "buy_now" }
  IMPORTANT: upsellCard.productId MUST be a valid ID from the product catalog below. The UI will auto-fill the purchase link.

## Product Catalog
When recommending products, use these exact productIds:
${catalogSummary}

${productRecs}

## Available Actions
- highlight_node: Highlight a health trait on the body visualization. Payload: { "traitId": "trait_name" }
- show_upsell: Show a product card. Handled via upsellCard field — do NOT add to actions array.
- run_simulation: Run a what-if scenario. Payload: { "scenario": "reduce_caffeine|high_protein|intermittent_fasting|increase_sleep|high_carb" }
- open_concierge: Connect to concierge. Payload: { "context": "summary" }
- generate_meal_image: Generate a photo of a meal. Payload: { "description": "detailed description of the dish — ingredients, plating, style" }. Use when the user asks to see a meal, recipe, or food recommendation. Be specific and vivid in the description.

${causeEffects}

${traitKnowledge ? `## Detailed Trait Knowledge (for traits needing attention)\n\n${traitKnowledge}` : ""}

## Rules
1. Every response: Insight → Reason → Suggestion
2. Upsell: explain problem first, then recommend naturally. Max 1 product per response.
3. Always use a productId from the catalog — never invent product names.
4. Mention price in your text when recommending: "The 10X Omega-3 ($39.99) could help..."
5. For "what if" questions: include run_simulation action
6. When the user asks to SEE a meal or says "show me": include generate_meal_image action with a detailed food description
7. Keep responses concise and warm`;
}

// ── Profile Derivation (rule-based, no LLM needed for MVP) ──

function findBiomarkerValue(report: BloodLabReport, name: string): { value: number; optimalMin: number; optimalMax: number } | null {
  for (const system of report.systems) {
    const bm = system.biomarkers.find(b => b.name === name);
    if (bm) return { value: bm.value, optimalMin: bm.optimalMin, optimalMax: bm.optimalMax };
  }
  return null;
}

function isInOptimal(bm: { value: number; optimalMin: number; optimalMax: number }): boolean {
  return bm.value >= bm.optimalMin && bm.value <= bm.optimalMax;
}

function isNearBoundary(bm: { value: number; optimalMin: number; optimalMax: number }): boolean {
  const range = bm.optimalMax - bm.optimalMin;
  const margin = range * 0.15;
  return (bm.value >= bm.optimalMax - margin && bm.value <= bm.optimalMax + margin) ||
         (bm.value >= bm.optimalMin - margin && bm.value <= bm.optimalMin + margin);
}

function deriveProfileFromReports(reports: HealthReport[]): UserProfile {
  const blood = reports.find(r => r.type === "blood-lab") as BloodLabReport | undefined;
  const genetic = reports.find(r => r.type === "genetic") as GeneticReport | undefined;
  const mito = reports.find(r => r.type === "mitoscreen") as MitoScreenReport | undefined;

  // Caffeine sensitivity: COMT gene + cortisol
  let caffeine_sensitivity: UserProfile["caffeine_sensitivity"] = "moderate";
  if (genetic) {
    const comt = genetic.genes.find(g => g.id === "comt");
    if (comt?.enzymeActivity === "significantly-reduced") caffeine_sensitivity = "high";
    else if (comt?.enzymeActivity === "reduced") caffeine_sensitivity = "moderate";
    else caffeine_sensitivity = "low";
  }
  if (blood) {
    const cortisol = findBiomarkerValue(blood, "Cortisol");
    if (cortisol && cortisol.value > cortisol.optimalMax) caffeine_sensitivity = "high";
  }

  // Carb tolerance: HbA1c, glucose, insulin
  let carb_tolerance: UserProfile["carb_tolerance"] = "moderate";
  if (blood) {
    const hba1c = findBiomarkerValue(blood, "HbA1c");
    const glucose = findBiomarkerValue(blood, "Glucose");
    const insulin = findBiomarkerValue(blood, "Insulin");
    const outOfRange = [hba1c, glucose, insulin].filter(b => b && !isInOptimal(b)).length;
    if (outOfRange >= 2) carb_tolerance = "low";
    else if (outOfRange === 0) carb_tolerance = "high";
    else carb_tolerance = "moderate";
  }

  // Fat metabolism: triglycerides, HDL, LDL
  let fat_metabolism: UserProfile["fat_metabolism"] = "moderate";
  if (blood) {
    const trig = findBiomarkerValue(blood, "Triglycerides");
    const hdl = findBiomarkerValue(blood, "HDL Cholesterol");
    const ldl = findBiomarkerValue(blood, "LDL Cholesterol");
    const allOptimal = [trig, hdl, ldl].every(b => b && isInOptimal(b));
    const anyBad = [trig, hdl, ldl].some(b => b && !isInOptimal(b) && !isNearBoundary(b));
    if (allOptimal) fat_metabolism = "high";
    else if (anyBad) fat_metabolism = "low";
  }

  // Inflammation: WBC, AST, ALT
  let inflammation_tendency: UserProfile["inflammation_tendency"] = "moderate";
  if (blood) {
    const wbc = findBiomarkerValue(blood, "WBC");
    const ast = findBiomarkerValue(blood, "AST");
    const alt = findBiomarkerValue(blood, "ALT");
    const outOfRange = [wbc, ast, alt].filter(b => b && !isInOptimal(b)).length;
    if (outOfRange >= 2) inflammation_tendency = "high";
    else if (outOfRange === 0) inflammation_tendency = "low";
  }

  // Recovery rate: MitoScore + hormones
  let recovery_rate: UserProfile["recovery_rate"] = "moderate";
  if (mito) {
    if (mito.mitoScore > 75) recovery_rate = "fast";
    else if (mito.mitoScore < 50) recovery_rate = "slow";
  }
  if (blood) {
    const testosterone = findBiomarkerValue(blood, "Testosterone");
    const igf1 = findBiomarkerValue(blood, "IGF-1");
    if (testosterone && !isInOptimal(testosterone) && igf1 && !isInOptimal(igf1)) {
      recovery_rate = "slow";
    }
  }

  // Sleep quality: cortisol + thyroid + genetic
  let sleep_quality_tendency: UserProfile["sleep_quality_tendency"] = "average";
  if (blood) {
    const cortisol = findBiomarkerValue(blood, "Cortisol");
    const tsh = findBiomarkerValue(blood, "TSH");
    const cortisolHigh = cortisol && cortisol.value > cortisol.optimalMax;
    const thyroidOff = tsh && !isInOptimal(tsh);
    if (cortisolHigh && thyroidOff) sleep_quality_tendency = "poor";
    else if (cortisolHigh || thyroidOff) sleep_quality_tendency = "average";
    else sleep_quality_tendency = "good";
  }
  if (genetic) {
    const mthfr = genetic.genes.find(g => g.id === "mthfr");
    const comt = genetic.genes.find(g => g.id === "comt");
    if (mthfr?.enzymeActivity !== "normal" || comt?.enzymeActivity !== "normal") {
      if (sleep_quality_tendency === "good") sleep_quality_tendency = "average";
    }
  }

  return { caffeine_sensitivity, carb_tolerance, fat_metabolism, inflammation_tendency, recovery_rate, sleep_quality_tendency };
}

// ── Trait Chips ──

function traitStatusFromLevel(level: string, inverted = false): TraitStatus {
  // For most traits: high = good. For inflammation/caffeine sensitivity: low = good.
  if (inverted) {
    if (level === "low") return "optimal";
    if (level === "moderate") return "moderate";
    return "attention";
  }
  if (level === "high" || level === "good" || level === "fast") return "optimal";
  if (level === "moderate" || level === "average") return "moderate";
  return "attention";
}

function buildTraitChips(profile: UserProfile): TraitChip[] {
  // Load trait metadata from markdown files
  const allTraits = loadAllTraits();
  const traitMap = new Map(allTraits.map(t => [t.id, t]));

  const getExplanation = (id: string, fallback: string) =>
    traitMap.get(id)?.explanation || fallback;

  return [
    {
      id: "caffeine_sensitivity",
      label: "Caffeine Sensitivity",
      level: profile.caffeine_sensitivity,
      status: traitStatusFromLevel(profile.caffeine_sensitivity, true),
      description: getExplanation("caffeine_sensitivity", "How your body processes caffeine."),
    },
    {
      id: "carb_tolerance",
      label: "Carb Tolerance",
      level: profile.carb_tolerance,
      status: traitStatusFromLevel(profile.carb_tolerance),
      description: getExplanation("carb_tolerance", "How efficiently your body processes carbohydrates."),
    },
    {
      id: "fat_metabolism",
      label: "Fat Metabolism",
      level: profile.fat_metabolism,
      status: traitStatusFromLevel(profile.fat_metabolism),
      description: getExplanation("fat_metabolism", "How well your body breaks down and uses dietary fats."),
    },
    {
      id: "inflammation_tendency",
      label: "Inflammation",
      level: profile.inflammation_tendency,
      status: traitStatusFromLevel(profile.inflammation_tendency, true),
      description: getExplanation("inflammation_tendency", "How much systemic inflammation your body carries."),
    },
    {
      id: "recovery_rate",
      label: "Recovery Rate",
      level: profile.recovery_rate,
      status: traitStatusFromLevel(profile.recovery_rate),
      description: getExplanation("recovery_rate", "How quickly your body repairs after exercise or stress."),
    },
    {
      id: "sleep_quality_tendency",
      label: "Sleep Quality",
      level: profile.sleep_quality_tendency,
      status: traitStatusFromLevel(profile.sleep_quality_tendency),
      description: getExplanation("sleep_quality_tendency", "Your predisposition for quality sleep."),
    },
  ];
}

// ── Public API ──

/**
 * Initialize the health twin: derive profile from reports, compute metrics.
 */
export async function initAnalysis(reports: HealthReport[]): Promise<InitResponse> {
  const profile = deriveProfileFromReports(reports);
  const metrics = computeMetrics(profile);
  const traits = buildTraitChips(profile);

  // Generate greeting
  const patientName = reports[0]?.patient?.name?.split(" ")[0] || "there";
  const bestTrait = traits.find(t => t.status === "optimal");
  const needsWork = traits.find(t => t.status === "attention");

  let greeting = `Hey ${patientName}! I've analyzed your 10X Health reports and built your Health Twin. `;
  if (bestTrait) {
    greeting += `Your ${bestTrait.label.toLowerCase()} looks great. `;
  }
  if (needsWork) {
    greeting += `Your ${needsWork.label.toLowerCase()} is an area where we could explore some improvements. `;
  }
  greeting += "What would you like to explore first?";

  return { profile, metrics, traits, greeting };
}

/**
 * Chat with the agent. Sends profile context + conversation history to the LLM.
 */
export async function chat(
  message: string,
  profile: UserProfile,
  metrics: DerivedMetrics,
  traits: TraitChip[],
  conversationHistory: AgentMessage[]
): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(profile, metrics, traits);

  const historyText = conversationHistory
    .slice(-10) // keep last 10 messages for context
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const userMessage = historyText
    ? `Previous conversation:\n${historyText}\n\nUser's new message: ${message}`
    : message;

  const raw = await callLLM({ systemPrompt, userMessage });

  try {
    const parsed = JSON.parse(raw);
    return {
      text: parsed.text || "I'm not sure how to respond to that. Could you rephrase?",
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      upsellCard: parsed.upsellCard || undefined,
    };
  } catch {
    // If LLM returns non-JSON, wrap it as plain text
    return {
      text: raw.slice(0, 500) || "I had trouble processing that. Could you try again?",
      actions: [],
    };
  }
}

/**
 * Run a simulation scenario. Pure rule-based, no LLM.
 */
export function runSimulation(
  scenario: ScenarioId,
  profile: UserProfile,
  metrics: DerivedMetrics
): SimulationResult {
  return simulate(scenario, profile, metrics);
}

/**
 * Generate a personalized daily plan.
 */
export function generateDailyPlan(
  profile: UserProfile,
  metrics: DerivedMetrics,
  sleep?: "good" | "okay" | "bad",
  stress?: "good" | "okay" | "bad"
): DailyPlan {
  // Rule-based plan generation using profile traits

  const nutritionItems: string[] = [];
  const supplementItems: string[] = [];
  const activityItems: string[] = [];

  // Nutrition based on profile
  if (profile.carb_tolerance === "low") {
    nutritionItems.push("Go lighter on carbs today — focus on protein and healthy fats");
    nutritionItems.push("Eat protein before carbs at each meal to blunt sugar spikes");
  } else if (profile.carb_tolerance === "moderate") {
    nutritionItems.push("Balance your carbs with protein at every meal");
  } else {
    nutritionItems.push("Your carb tolerance is strong — enjoy a balanced mix of macros");
  }

  if (profile.fat_metabolism !== "high") {
    nutritionItems.push("Add omega-3 rich foods: salmon, sardines, or walnuts");
  }

  if (profile.inflammation_tendency !== "low") {
    nutritionItems.push("Include anti-inflammatory foods: turmeric, berries, leafy greens");
  }

  // Supplements based on profile
  if (profile.caffeine_sensitivity === "high") {
    supplementItems.push("L-theanine (200mg) if you have caffeine — may help smooth the energy curve");
  }
  if (profile.inflammation_tendency !== "low") {
    supplementItems.push("Omega-3 Fish Oil (2-4g EPA/DHA) with a meal");
    supplementItems.push("NAC (600mg) — supports your body's master antioxidant");
  }
  if (profile.sleep_quality_tendency !== "good") {
    supplementItems.push("Magnesium glycinate (400mg) in the evening");
  }
  supplementItems.push("Vitamin D3 + K2 (5000 IU) with morning meal");

  // Activity based on profile + optional inputs
  const highStress = stress === "bad";
  if (profile.recovery_rate === "slow" || highStress) {
    activityItems.push("Light movement today — 20-minute walk or gentle yoga");
    activityItems.push("Prioritize rest and recovery");
  } else if (profile.recovery_rate === "fast") {
    activityItems.push("Your recovery looks strong — resistance training is a great option");
    activityItems.push("30-minute Zone 2 cardio for metabolic health");
  } else {
    activityItems.push("Moderate workout recommended — mix of strength and movement");
    activityItems.push("10-15 minute post-meal walk to support blood sugar");
  }

  if (sleep === "bad" || profile.sleep_quality_tendency === "poor") {
    activityItems.push("No caffeine after noon — prioritize sleep tonight");
  }

  return {
    nutrition: {
      title: "Nutrition",
      items: nutritionItems,
      badge: "Based on your metabolic profile",
    },
    supplements: {
      title: "Supplements",
      items: supplementItems,
      badge: "Matched to your biomarkers",
    },
    activity: {
      title: "Activity",
      items: activityItems,
      badge: `Based on your recovery rate`,
    },
  };
}
