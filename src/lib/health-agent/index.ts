/**
 * Health Agent — Public API
 *
 * Single entry point for the health agent library.
 * Import from here when integrating into a host app.
 */

// Core agent
export { initAnalysis, chat, runSimulation, generateDailyPlan, buildSystemPrompt } from "./agent";

// Simulation
export { simulate, applyDelta, computeMetrics } from "./simulation-rules";

// Products
export { getProduct, getCatalogSummary } from "./product-catalog";

// Knowledge
export { loadAllTraits, loadPlaybooks, writeKnowledgeFile, clearCache } from "./knowledge-loader";

// Live API tools
export { LIVE_FUNCTION_DECLARATIONS } from "./live-tools";
export { TOOL_DESCRIPTIONS } from "./tools";

// Types
export type {
  UserProfile,
  DerivedMetrics,
  TraitChip,
  TraitStatus,
  AgentMessage,
  AgentResponse,
  AgentAction,
  AgentActionType,
  InitResponse,
  SimulationResult,
  ScenarioId,
  ScenarioConfig,
  VoiceState,
  UpsellCardData,
  DailyPlan,
} from "./types";

export { SCENARIOS } from "./types";
