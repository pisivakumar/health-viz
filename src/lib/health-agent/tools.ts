/**
 * Agent-invokable tool definitions.
 *
 * These define what the LLM agent can "call" during a conversation.
 * The actual execution happens client-side — the agent returns action objects,
 * and the React UI interprets them.
 */

import type { AgentAction, ScenarioId, UpsellCardData } from "./types";

/**
 * Highlight a trait node on the 3D orb.
 */
export function highlightNode(traitId: string): AgentAction {
  return { type: "highlight_node", payload: { traitId } };
}

/**
 * Show an inline upsell card in the chat.
 */
export function showUpsellCard(card: UpsellCardData): AgentAction {
  return { type: "show_upsell", payload: card as unknown as Record<string, unknown> };
}

/**
 * Open the concierge modal with context.
 */
export function openConcierge(context: string): AgentAction {
  return { type: "open_concierge", payload: { context } };
}

/**
 * Trigger a simulation scenario (switches to Simulate tab).
 */
export function runSimulation(scenario: ScenarioId): AgentAction {
  return { type: "run_simulation", payload: { scenario } };
}

/**
 * Add an item to the supplement cart.
 */
export function addToCart(item: { systemName: string; title: string; description: string }): AgentAction {
  return { type: "add_to_cart", payload: item };
}

/**
 * Switch to the Today tab and show the daily plan.
 */
export function showDailyPlan(): AgentAction {
  return { type: "show_daily_plan", payload: {} };
}

/**
 * Tool definitions for the LLM system prompt (describes available actions).
 * The agent uses these to decide which actions to include in its response.
 */
export const TOOL_DESCRIPTIONS = [
  {
    name: "highlight_node",
    description: "Highlight a trait node on the 3D orb visualization to draw the user's attention to a specific health trait.",
    parameters: { traitId: "string — one of: caffeine_sensitivity, carb_tolerance, fat_metabolism, inflammation_tendency, recovery_rate, sleep_quality_tendency" },
  },
  {
    name: "show_upsell",
    description: "Show a supplement or service recommendation card inline in the chat. Use after explaining a health insight, never as the opening move.",
    parameters: { product: "string", description: "string", price: "string (optional)", cta: "'add_to_plan' | 'talk_to_concierge'" },
  },
  {
    name: "open_concierge",
    description: "Open a live chat with a 10X Health concierge. Use when the user's needs go beyond what the agent can address.",
    parameters: { context: "string — summary of the conversation so far" },
  },
  {
    name: "run_simulation",
    description: "Run a what-if simulation and show side-by-side orb comparison. Use when the user asks 'what if' questions.",
    parameters: { scenario: "'reduce_caffeine' | 'high_protein' | 'intermittent_fasting' | 'increase_sleep' | 'high_carb'" },
  },
  {
    name: "add_to_cart",
    description: "Add a supplement to the user's plan cart.",
    parameters: { systemName: "string", title: "string", description: "string" },
  },
  {
    name: "show_daily_plan",
    description: "Switch to the Today tab and display the user's personalized daily plan.",
    parameters: {},
  },
] as const;
