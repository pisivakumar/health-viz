/**
 * Rule-based simulation engine.
 *
 * Pure functions, no LLM calls. Maps (profile + scenario) → metric deltas + explanations.
 * Each scenario defines how traits and metrics shift based on the user's current state.
 */

import type {
  UserProfile,
  DerivedMetrics,
  SimulationResult,
  ScenarioId,
  TraitLevel,
  SleepLevel,
  RecoveryLevel,
} from "./types";
import config from "./knowledge/config.json";

// ── Helpers ──

const LEVEL_VALUES = config.trait_to_metric_value as Record<string, number>;

function levelToNum(level: string): number {
  return LEVEL_VALUES[level] ?? 55;
}

function improveTraitLevel(current: TraitLevel): TraitLevel {
  if (current === "low") return "moderate";
  if (current === "moderate") return "high";
  return "high";
}

function worsenTraitLevel(current: TraitLevel): TraitLevel {
  if (current === "high") return "moderate";
  if (current === "moderate") return "low";
  return "low";
}

function improveSleep(current: SleepLevel): SleepLevel {
  if (current === "poor") return "average";
  if (current === "average") return "good";
  return "good";
}

function improveRecovery(current: RecoveryLevel): RecoveryLevel {
  if (current === "slow") return "moderate";
  if (current === "moderate") return "fast";
  return "fast";
}

// ── Scenario Rules ──

type RuleFn = (profile: UserProfile, metrics: DerivedMetrics) => SimulationResult;

const rules: Partial<Record<ScenarioId, RuleFn>> = {
  reduce_caffeine(profile, metrics) {
    const energyDelta = profile.caffeine_sensitivity === "high" ? 12 : profile.caffeine_sensitivity === "moderate" ? 6 : 2;
    const stressDelta = profile.caffeine_sensitivity === "high" ? -18 : profile.caffeine_sensitivity === "moderate" ? -10 : -3;
    const traitChanges: Partial<UserProfile> = {};

    if (profile.caffeine_sensitivity !== "low") {
      traitChanges.sleep_quality_tendency = improveSleep(profile.sleep_quality_tendency);
    }

    const affectedCount = profile.caffeine_sensitivity === "high" ? 3 : profile.caffeine_sensitivity === "moderate" ? 2 : 1;

    return {
      scenario: "reduce_caffeine",
      delta: {
        energy_stability: energyDelta,
        metabolic_balance: Math.round(energyDelta * 0.3),
        stress_load: stressDelta,
      },
      confidence: affectedCount >= 3 ? "high" : affectedCount >= 2 ? "medium" : "low",
      explanation: profile.caffeine_sensitivity === "high"
        ? "Your COMT gene variants suggest caffeine lingers in your system longer than average. Reducing intake may significantly improve your sleep quality and lower stress hormones."
        : profile.caffeine_sensitivity === "moderate"
        ? "Your profile suggests moderate caffeine sensitivity. Cutting back, especially in the afternoon, could help stabilize energy and improve sleep."
        : "Your caffeine metabolism appears efficient. Reducing intake may have a mild positive effect on sleep quality.",
      trait_changes: traitChanges,
    };
  },

  high_protein(profile, metrics) {
    const carbBoost = profile.carb_tolerance === "low" ? 10 : profile.carb_tolerance === "moderate" ? 6 : 3;
    const traitChanges: Partial<UserProfile> = {};

    if (profile.carb_tolerance !== "high") {
      traitChanges.carb_tolerance = improveTraitLevel(profile.carb_tolerance);
    }
    if (profile.recovery_rate !== "fast") {
      traitChanges.recovery_rate = improveRecovery(profile.recovery_rate);
    }

    return {
      scenario: "high_protein",
      delta: {
        energy_stability: carbBoost,
        metabolic_balance: Math.round(carbBoost * 0.8),
        stress_load: -Math.round(carbBoost * 0.3),
      },
      confidence: profile.carb_tolerance === "low" ? "high" : "medium",
      explanation: profile.carb_tolerance === "low"
        ? "With low carb tolerance, shifting to higher protein intake may help stabilize blood sugar and reduce energy crashes throughout the day."
        : "A high-protein approach could support your recovery rate and provide more sustained energy, with moderate benefits for metabolic balance.",
      trait_changes: traitChanges,
    };
  },

  intermittent_fasting(profile, metrics) {
    const fatBoost = profile.fat_metabolism === "low" ? 14 : profile.fat_metabolism === "moderate" ? 8 : 4;
    const inflammationReduction = profile.inflammation_tendency === "high" ? 12 : profile.inflammation_tendency === "moderate" ? 6 : 2;
    const traitChanges: Partial<UserProfile> = {};

    if (profile.fat_metabolism !== "high") {
      traitChanges.fat_metabolism = improveTraitLevel(profile.fat_metabolism);
    }
    if (profile.inflammation_tendency !== "low") {
      traitChanges.inflammation_tendency = worsenTraitLevel(profile.inflammation_tendency) as TraitLevel;
      // worsenTraitLevel for inflammation = reduce it, which is the improvement direction
    }

    return {
      scenario: "intermittent_fasting",
      delta: {
        energy_stability: Math.round(fatBoost * 0.4),
        metabolic_balance: fatBoost,
        stress_load: -inflammationReduction,
      },
      confidence: (profile.fat_metabolism === "low" || profile.inflammation_tendency === "high") ? "high" : "medium",
      explanation: profile.fat_metabolism === "low"
        ? "Your lipid markers suggest room for improvement in fat metabolism. Intermittent fasting may help your body become more efficient at using fat for fuel, while also reducing inflammatory markers."
        : "Intermittent fasting could further optimize your already-decent fat metabolism and may help reduce systemic inflammation.",
      trait_changes: traitChanges,
    };
  },

  increase_sleep(profile, metrics) {
    const sleepBoost = profile.sleep_quality_tendency === "poor" ? 18 : profile.sleep_quality_tendency === "average" ? 10 : 3;
    const traitChanges: Partial<UserProfile> = {};

    traitChanges.sleep_quality_tendency = improveSleep(profile.sleep_quality_tendency);
    if (profile.recovery_rate !== "fast") {
      traitChanges.recovery_rate = improveRecovery(profile.recovery_rate);
    }

    return {
      scenario: "increase_sleep",
      delta: {
        energy_stability: sleepBoost,
        metabolic_balance: Math.round(sleepBoost * 0.5),
        stress_load: -Math.round(sleepBoost * 0.8),
      },
      confidence: profile.sleep_quality_tendency === "poor" ? "high" : "medium",
      explanation: profile.sleep_quality_tendency === "poor"
        ? "Your profile indicates factors that may be affecting sleep quality, including cortisol patterns and genetic markers. Prioritizing 8+ hours of quality sleep could have a significant positive cascade across energy, recovery, and stress."
        : profile.sleep_quality_tendency === "average"
        ? "Your sleep tendency is average — increasing to 8+ hours with good sleep hygiene could meaningfully boost energy stability and lower stress."
        : "Your sleep profile looks good. Small optimizations like consistent timing and cooler room temperature could provide marginal improvements.",
      trait_changes: traitChanges,
    };
  },

  high_carb(profile, metrics) {
    const energyDrop = profile.carb_tolerance === "low" ? -15 : profile.carb_tolerance === "moderate" ? -8 : -3;
    const traitChanges: Partial<UserProfile> = {};

    if (profile.carb_tolerance !== "high") {
      traitChanges.carb_tolerance = worsenTraitLevel(profile.carb_tolerance);
    }
    if (profile.inflammation_tendency !== "high") {
      traitChanges.inflammation_tendency = improveTraitLevel(profile.inflammation_tendency);
      // improveTraitLevel for inflammation = increase it, which is the worsening direction
    }

    return {
      scenario: "high_carb",
      delta: {
        energy_stability: energyDrop,
        metabolic_balance: Math.round(energyDrop * 0.7),
        stress_load: -Math.round(energyDrop * 0.4),
      },
      confidence: profile.carb_tolerance === "low" ? "high" : "medium",
      explanation: profile.carb_tolerance === "low"
        ? "With your current metabolic markers, a high-carb diet may lead to more pronounced blood sugar swings, energy crashes, and increased inflammation."
        : profile.carb_tolerance === "moderate"
        ? "Your moderate carb tolerance suggests that a high-carb approach could lead to some energy instability and mild metabolic stress."
        : "Your carb tolerance is good, so a high-carb diet may have relatively minor negative effects, though it could still slightly increase inflammation.",
      trait_changes: traitChanges,
    };
  },
};

// ── Public API ──

/**
 * Run a simulation scenario against a user profile.
 * Pure computation — no network calls.
 */
export function simulate(
  scenario: ScenarioId,
  profile: UserProfile,
  metrics: DerivedMetrics
): SimulationResult {
  const ruleFn = rules[scenario];
  if (!ruleFn) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }
  return ruleFn(profile, metrics);
}

/**
 * Apply simulation deltas to metrics, clamping to 0-100.
 */
export function applyDelta(
  metrics: DerivedMetrics,
  delta: SimulationResult["delta"]
): DerivedMetrics {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return {
    energy_stability: clamp(metrics.energy_stability + delta.energy_stability),
    metabolic_balance: clamp(metrics.metabolic_balance + delta.metabolic_balance),
    stress_load: clamp(metrics.stress_load + delta.stress_load),
  };
}

/**
 * Derive initial metrics from a UserProfile using knowledge base weights.
 */
export function computeMetrics(profile: UserProfile): DerivedMetrics {
  // Energy Stability = f(carb_tolerance: 0.4, caffeine_sensitivity_inv: 0.3, sleep_quality: 0.3)
  const carbVal = levelToNum(profile.carb_tolerance);
  const caffeineInv = 100 - levelToNum(profile.caffeine_sensitivity); // invert: low sensitivity = good
  const sleepVal = levelToNum(profile.sleep_quality_tendency);
  const energy_stability = Math.round(carbVal * 0.4 + caffeineInv * 0.3 + sleepVal * 0.3);

  // Metabolic Balance = f(fat_metabolism: 0.35, inflammation_inv: 0.35, recovery_rate: 0.3)
  const fatVal = levelToNum(profile.fat_metabolism);
  const inflammationInv = 100 - levelToNum(profile.inflammation_tendency); // invert: low inflammation = good
  const recoveryVal = levelToNum(profile.recovery_rate);
  const metabolic_balance = Math.round(fatVal * 0.35 + inflammationInv * 0.35 + recoveryVal * 0.3);

  // Stress Load = f(cortisol_based: 0.4, inflammation: 0.3, sleep_quality_inv: 0.3)
  // Higher caffeine sensitivity ≈ higher cortisol load
  const cortisolProxy = levelToNum(profile.caffeine_sensitivity);
  const inflammationVal = levelToNum(profile.inflammation_tendency);
  const sleepInv = 100 - sleepVal; // invert: poor sleep = more stress
  const stress_load = Math.round(cortisolProxy * 0.4 + inflammationVal * 0.3 + sleepInv * 0.3);

  return { energy_stability, metabolic_balance, stress_load };
}
