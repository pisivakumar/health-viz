/**
 * Improvement recommendations per body system.
 *
 * Shown when a user drags their goal higher on the radar chart.
 * Each system has tiered recommendations based on how much
 * improvement the user is targeting.
 */

export interface Recommendation {
  title: string;
  description: string;
  type: "supplement" | "lifestyle" | "test" | "consult";
  impact: "high" | "medium" | "low";
}

export interface SystemRecommendations {
  systemId: string;
  systemName: string;
  tagline: string;
  recommendations: Recommendation[];
}

const recommendations: Record<string, SystemRecommendations> = {
  thyroid: {
    systemId: "thyroid",
    systemName: "Thyroid",
    tagline: "Your thyroid controls metabolism, energy, and temperature regulation.",
    recommendations: [
      {
        title: "Selenium (200mcg daily)",
        description: "Supports T4 to T3 conversion — the step most people are missing. Brazil nuts are a natural source.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "Iodine-rich foods",
        description: "Seaweed, fish, and eggs provide the raw material your thyroid needs to produce hormones.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Reduce stress & improve sleep",
        description: "Chronic stress suppresses TSH and slows thyroid function. Prioritize 7-9 hours of quality sleep.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Full thyroid panel retest",
        description: "Retest TSH, Free T3, Free T4, and thyroid antibodies in 90 days to track progress.",
        type: "test",
        impact: "medium",
      },
    ],
  },
  vitamins: {
    systemId: "vitamins",
    systemName: "Vitamins",
    tagline: "Vitamins are co-factors for hundreds of reactions in your body.",
    recommendations: [
      {
        title: "Methylated B12 (1000mcg sublingual)",
        description: "The active form your body can use immediately. Sublingual bypasses gut absorption issues.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "Vitamin D3 + K2 (5000 IU daily)",
        description: "D3 for immune and bone health. K2 ensures calcium goes to bones, not arteries.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "20 minutes of morning sun",
        description: "Natural vitamin D production plus circadian rhythm benefits. No sunscreen needed for this short window.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Organ meats or quality multivitamin",
        description: "Liver is the most nutrient-dense food on earth. If that's not your thing, a high-quality multi fills the gaps.",
        type: "supplement",
        impact: "medium",
      },
    ],
  },
  lipids: {
    systemId: "lipids",
    systemName: "Lipids",
    tagline: "Your lipid panel shows cardiovascular risk and fat metabolism health.",
    recommendations: [
      {
        title: "Omega-3 Fish Oil (2-4g EPA/DHA daily)",
        description: "Lowers triglycerides, raises HDL, and reduces inflammation. The single best supplement for heart health.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "Reduce refined carbs and sugar",
        description: "Sugar — not fat — is the primary driver of high triglycerides and poor lipid ratios.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Zone 2 cardio (150 min/week)",
        description: "Low-intensity exercise like brisk walking or easy cycling raises HDL and improves fat metabolism.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Advanced lipid panel (NMR LipoProfile)",
        description: "Standard cholesterol numbers don't tell the whole story. Particle size and count matter more.",
        type: "test",
        impact: "medium",
      },
    ],
  },
  blood: {
    systemId: "blood",
    systemName: "Blood",
    tagline: "Your blood markers reveal oxygen delivery, immune function, and overall vitality.",
    recommendations: [
      {
        title: "Iron-rich foods + Vitamin C",
        description: "Red meat, spinach, and lentils paired with vitamin C dramatically boost iron absorption.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Stay hydrated (half your body weight in oz)",
        description: "Dehydration concentrates blood, artificially raising hematocrit and hemoglobin readings.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Folate (methylfolate 800mcg)",
        description: "Essential for red blood cell production. Especially important if you have MTHFR variants.",
        type: "supplement",
        impact: "medium",
      },
      {
        title: "Blood donation or therapeutic phlebotomy",
        description: "If hemoglobin/hematocrit are elevated, regular donation keeps levels in range and helps others.",
        type: "consult",
        impact: "high",
      },
    ],
  },
  sugar_metabolism: {
    systemId: "sugar_metabolism",
    systemName: "Sugar Metabolism",
    tagline: "How efficiently your body processes glucose directly impacts energy, weight, and disease risk.",
    recommendations: [
      {
        title: "Post-meal walks (10-15 min)",
        description: "Walking after eating can lower blood sugar spikes by up to 30%. The easiest high-impact habit.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Berberine (500mg 2x daily with meals)",
        description: "A natural compound shown in studies to rival metformin for blood sugar management.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "Eat protein and fat before carbs",
        description: "Food order matters — starting with protein/fat slows glucose absorption and blunts sugar spikes.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Continuous Glucose Monitor (2-week trial)",
        description: "See exactly how YOUR body responds to specific foods. Everyone's glucose response is different.",
        type: "test",
        impact: "high",
      },
    ],
  },
  liver: {
    systemId: "liver",
    systemName: "Liver",
    tagline: "Your liver detoxifies, builds proteins, and processes everything you eat and drink.",
    recommendations: [
      {
        title: "NAC (N-Acetyl Cysteine, 600mg 2x daily)",
        description: "Boosts glutathione — your liver's master antioxidant. The single best liver support supplement.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "Reduce or eliminate alcohol",
        description: "Even moderate drinking stresses your liver. A 30-day break can dramatically improve liver enzymes.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Cruciferous vegetables daily",
        description: "Broccoli, cauliflower, Brussels sprouts contain compounds that activate liver detox pathways.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Milk thistle (Silymarin 200mg)",
        description: "Centuries of use backed by modern research. Protects liver cells and supports regeneration.",
        type: "supplement",
        impact: "medium",
      },
    ],
  },
  kidneys: {
    systemId: "kidneys",
    systemName: "Kidneys",
    tagline: "Your kidneys filter 200 liters of blood daily, balancing fluids and electrolytes.",
    recommendations: [
      {
        title: "Hydration goal: half body weight (lbs) in oz",
        description: "Your kidneys need water to filter efficiently. Most people are chronically under-hydrated.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Reduce sodium, increase potassium",
        description: "Less processed food + more bananas, avocados, and sweet potatoes eases kidney workload.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Monitor blood pressure",
        description: "High blood pressure is the #1 cause of kidney damage. Keep it below 120/80.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Cystatin C test",
        description: "A more accurate kidney function marker than creatinine alone, especially for muscular individuals.",
        type: "test",
        impact: "medium",
      },
    ],
  },
  hormones: {
    systemId: "hormones",
    systemName: "Hormones",
    tagline: "Hormones orchestrate energy, mood, muscle, sleep, and sex drive.",
    recommendations: [
      {
        title: "Resistance training 3-4x/week",
        description: "The most powerful natural testosterone booster. Compound lifts (squats, deadlifts) have the biggest impact.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Optimize sleep (7-9 hours, cool & dark)",
        description: "Testosterone and growth hormone are primarily produced during deep sleep. Poor sleep = poor hormones.",
        type: "lifestyle",
        impact: "high",
      },
      {
        title: "Ashwagandha (KSM-66, 600mg daily)",
        description: "Clinically shown to lower cortisol 30% and boost testosterone. Also reduces stress and anxiety.",
        type: "supplement",
        impact: "high",
      },
      {
        title: "DUTCH Complete Hormone Panel",
        description: "Goes beyond blood tests to show how your body metabolizes hormones. Reveals hidden imbalances.",
        type: "test",
        impact: "medium",
      },
    ],
  },
  prostate: {
    systemId: "prostate",
    systemName: "Prostate",
    tagline: "Prostate health markers help catch issues early, when they're most treatable.",
    recommendations: [
      {
        title: "Saw Palmetto (320mg daily)",
        description: "The most studied natural prostate supplement. Supports healthy prostate size and urinary flow.",
        type: "supplement",
        impact: "medium",
      },
      {
        title: "Lycopene-rich foods",
        description: "Cooked tomatoes, watermelon, and pink grapefruit provide lycopene — shown to support prostate health.",
        type: "lifestyle",
        impact: "medium",
      },
      {
        title: "Annual PSA tracking",
        description: "The trend matters more than any single number. Track annually to catch changes early.",
        type: "test",
        impact: "high",
      },
      {
        title: "Consult urologist if PSA trending up",
        description: "Rising PSA over time warrants a specialist conversation, even if individual readings seem fine.",
        type: "consult",
        impact: "high",
      },
    ],
  },
};

export default recommendations;

/**
 * Get recommendations for a system based on the improvement delta.
 * Higher delta = more recommendations shown.
 */
export function getRecommendations(
  systemId: string,
  currentScore: number,
  goalScore: number
): Recommendation[] {
  const systemRecs = recommendations[systemId];
  if (!systemRecs) return [];

  const delta = goalScore - currentScore;
  if (delta <= 0) return [];

  // Show more recommendations for bigger goals
  if (delta > 30) return systemRecs.recommendations;
  if (delta > 15) return systemRecs.recommendations.slice(0, 3);
  return systemRecs.recommendations.filter((r) => r.impact === "high");
}

