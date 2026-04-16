/**
 * Health Twin data model.
 *
 * Simplified representation of 40+ biomarkers into 6 traits + 3 derived metrics.
 * Used by the agent, simulation engine, 3D orb, and all twin UI.
 */

import type { HealthReport, CartItem } from "../types";

// ── User Profile (6 simplified traits derived from reports) ──

export type TraitLevel = "low" | "moderate" | "high";
export type SleepLevel = "poor" | "average" | "good";
export type RecoveryLevel = "slow" | "moderate" | "fast";

export interface UserProfile {
  caffeine_sensitivity: TraitLevel;
  carb_tolerance: TraitLevel;
  fat_metabolism: TraitLevel;
  inflammation_tendency: TraitLevel;
  recovery_rate: RecoveryLevel;
  sleep_quality_tendency: SleepLevel;
}

// ── Derived Metrics (0-100 composites) ──

export interface DerivedMetrics {
  energy_stability: number;    // 0-100
  metabolic_balance: number;   // 0-100
  stress_load: number;         // 0-100
}

// ── Trait Chip (for UI display) ──

export type TraitStatus = "optimal" | "moderate" | "attention";

export interface TraitChip {
  id: string;
  label: string;
  level: string;
  status: TraitStatus;
  description: string;
}

// ── Simulation ──

export type ScenarioId =
  | "reduce_caffeine"
  | "high_protein"
  | "intermittent_fasting"
  | "increase_sleep"
  | "high_carb"
  | "custom";

export interface SimulationResult {
  scenario: ScenarioId;
  delta: {
    energy_stability: number;
    metabolic_balance: number;
    stress_load: number;
  };
  confidence: "low" | "medium" | "high";
  explanation: string;
  trait_changes: Partial<UserProfile>;
}

export interface ScenarioConfig {
  id: ScenarioId;
  label: string;
  icon: string;
  description: string;
}

export const SCENARIOS: ScenarioConfig[] = [
  { id: "reduce_caffeine", label: "Reduce Caffeine", icon: "☕", description: "Cut back on caffeine intake" },
  { id: "high_protein", label: "High Protein Diet", icon: "🥩", description: "Increase protein, moderate carbs" },
  { id: "intermittent_fasting", label: "Intermittent Fasting", icon: "⏰", description: "16:8 eating window" },
  { id: "increase_sleep", label: "Increase Sleep", icon: "😴", description: "Prioritize 8+ hours of quality sleep" },
  { id: "high_carb", label: "High Carb Diet", icon: "🍞", description: "Increase carbohydrate intake" },
];

// ── Daily Plan ──

export interface PlanCard {
  title: string;
  items: string[];
  badge: string;
}

export interface DailyPlan {
  nutrition: PlanCard;
  supplements: PlanCard;
  activity: PlanCard;
}

// ── Agent ──

export type AgentActionType =
  | "highlight_node"
  | "show_upsell"
  | "open_concierge"
  | "run_simulation"
  | "add_to_cart"
  | "show_daily_plan"
  | "generate_meal_image";

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
}

export interface UpsellCardData {
  productId?: string;
  product: string;
  description: string;
  price?: string;
  url?: string;
  imageUrl?: string;
  cta: "buy_now" | "add_to_plan" | "talk_to_concierge";
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  actions?: AgentAction[];
  upsellCard?: UpsellCardData;
  imageUrl?: string; // generated meal/food image
  timestamp: number;
}

export interface AgentContext {
  profile: UserProfile;
  metrics: DerivedMetrics;
  traits: TraitChip[];
  conversationHistory: AgentMessage[];
  reports: HealthReport[];
}

export interface AgentResponse {
  text: string;
  actions: AgentAction[];
  upsellCard?: UpsellCardData;
}

export interface InitResponse {
  profile: UserProfile;
  metrics: DerivedMetrics;
  traits: TraitChip[];
  greeting: string;
}

// ── Voice ──

export type VoiceState = "idle" | "connecting" | "listening" | "processing" | "speaking" | "error";

// ── Navigation ──

export type TwinTab = "twin" | "simulate" | "today" | "scan";
