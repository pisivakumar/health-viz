/**
 * Generates a personalized "Your Health Story" narrative
 * from structured report data.
 *
 * Template-based for the demo; in production, swap for an LLM call
 * to get truly conversational, dynamic summaries.
 */

import type { BloodLabReport, GeneticReport, MitoScreenReport, BodySystem } from "./types";

// ── Blood Lab Narrative ─────────────────────────────────────

function describeSystem(s: BodySystem): string {
  const optimal = s.biomarkers.filter((b) => b.status === "optimal");
  const outOfRange = s.biomarkers.filter((b) => b.status === "out-of-range");
  const subOptimal = s.biomarkers.filter((b) => b.status === "sub-optimal");

  if (s.overallStatus === "optimal") {
    return `Your **${s.name}** markers are looking great — ${optimal.length} out of ${s.biomarkers.length} in the optimal range.`;
  }

  const concerns: string[] = [];
  if (outOfRange.length > 0) {
    concerns.push(
      `${outOfRange.map((b) => `**${b.name}**`).join(" and ")} ${outOfRange.length === 1 ? "is" : "are"} outside the optimal range`
    );
  }
  if (subOptimal.length > 0) {
    concerns.push(
      `${subOptimal.map((b) => `**${b.name}**`).join(" and ")} ${subOptimal.length === 1 ? "is" : "are"} close but not quite there`
    );
  }

  if (s.overallStatus === "out-of-range") {
    return `Your **${s.name}** system needs some attention — ${concerns.join(", and ")}. The good news: these are markers that respond well to targeted changes.`;
  }

  return `Your **${s.name}** is almost there — ${concerns.join(", and ")}. Small adjustments could move these into the optimal zone.`;
}

export function generateBloodLabNarrative(report: BloodLabReport): string {
  const { patient, systems } = report;
  const firstName = patient.name.split(" ")[0];

  const optimalSystems = systems.filter((s) => s.overallStatus === "optimal");
  const needsAttention = systems.filter((s) => s.overallStatus === "out-of-range");
  const subOptimalSystems = systems.filter((s) => s.overallStatus === "sub-optimal");

  const totalBiomarkers = systems.reduce((acc, s) => acc + s.biomarkers.length, 0);
  const optimalBiomarkers = systems.reduce(
    (acc, s) => acc + s.biomarkers.filter((b) => b.status === "optimal").length,
    0
  );
  const optimalPct = Math.round((optimalBiomarkers / totalBiomarkers) * 100);

  // Opening
  let narrative = `${firstName}, here's what your blood work is telling us.\n\n`;

  // Big picture
  narrative += `Out of ${totalBiomarkers} biomarkers tested across ${systems.length} body systems, **${optimalBiomarkers} (${optimalPct}%) are in the optimal range**. `;

  if (optimalPct >= 80) {
    narrative += `That's an excellent foundation — your body is performing at a high level.\n\n`;
  } else if (optimalPct >= 60) {
    narrative += `That's a solid starting point, with clear opportunities to level up.\n\n`;
  } else {
    narrative += `There's real room for improvement, and the specific areas below show you exactly where to focus.\n\n`;
  }

  // Strengths
  if (optimalSystems.length > 0) {
    narrative += `**What's working well:** `;
    narrative += optimalSystems.map((s) => s.name).join(", ");
    narrative += ` — ${optimalSystems.length === 1 ? "this system is" : "these systems are"} performing optimally. Keep doing what you're doing here.\n\n`;
  }

  // Areas that need attention
  if (needsAttention.length > 0) {
    narrative += `**Where to focus:** `;
    needsAttention.forEach((s, i) => {
      narrative += describeSystem(s);
      if (i < needsAttention.length - 1) narrative += " ";
    });
    narrative += "\n\n";
  }

  // Sub-optimal areas
  if (subOptimalSystems.length > 0) {
    narrative += `**Almost optimal:** `;
    subOptimalSystems.forEach((s, i) => {
      narrative += describeSystem(s);
      if (i < subOptimalSystems.length - 1) narrative += " ";
    });
    narrative += "\n\n";
  }

  // Closing
  narrative += `Tap any system on the **Health Fingerprint** chart to see exactly what's happening and what you can do about it. Your body has the potential — now you have the roadmap.`;

  return narrative;
}

// ── Genetic Narrative ───────────────────────────────────────

export function generateGeneticNarrative(report: GeneticReport): string {
  const firstName = report.patient.name.split(" ")[0];
  const variants = report.genes.filter((g) => g.enzymeActivity !== "normal");
  const normal = report.genes.filter((g) => g.enzymeActivity === "normal");

  let narrative = `${firstName}, your genetic methylation test looked at ${report.genes.length} key genes that control how your body processes nutrients, manages mood, and handles detoxification.\n\n`;

  if (variants.length === 0) {
    narrative += `Great news — **all ${report.genes.length} genes show normal enzyme activity**. Your methylation cycle is running efficiently, which means your body converts nutrients, produces neurotransmitters, and detoxifies at full capacity.\n\n`;
  } else {
    narrative += `**${normal.length} of ${report.genes.length} genes** are functioning normally. `;
    narrative += `However, **${variants.length} ${variants.length === 1 ? "gene shows" : "genes show"} reduced activity**:\n\n`;

    variants.forEach((g) => {
      const severity = g.enzymeActivity === "significantly-reduced" ? "significantly reduced" : "reduced";
      narrative += `• **${g.name}** — enzyme activity is ${severity}, which can affect your ${g.affectedBodyPart.toLowerCase()}. ${g.symptoms.length > 0 ? `Common symptoms include ${g.symptoms.slice(0, 3).join(", ").toLowerCase()}.` : ""}\n`;
    });

    narrative += `\nThe key takeaway: knowing your genetic variants means you can **work with your body, not against it**. Targeted supplements can compensate for what your genes aren't doing efficiently.`;
  }

  return narrative;
}

// ── MitoScreen Narrative ────────────────────────────────────

export function generateMitoNarrative(report: MitoScreenReport): string {
  const firstName = report.patient.name.split(" ")[0];

  let narrative = `${firstName}, your MitoScore is **${report.mitoScore}** — that puts you in the ${report.mitoScore}th percentile, meaning your mitochondria are outperforming ${report.mitoScore}% of people tested.\n\n`;

  narrative += `Your profile type is **${report.profileType}**. `;

  if (report.mitoScore >= 75) {
    narrative += `Your cellular energy production is strong. The areas below show where you're excelling and where targeted improvements could take you even further.\n\n`;
  } else if (report.mitoScore >= 50) {
    narrative += `Your cells are producing energy at a functional level, but there's meaningful room to boost your cellular performance.\n\n`;
  } else {
    narrative += `Your mitochondria are struggling, which likely shows up as fatigue, slow recovery, and low energy. The good news: mitochondrial function is highly responsive to the right interventions.\n\n`;
  }

  // Find any borderline/compromised/critical metrics
  const allMetrics = [
    ...report.energyProfile,
    ...report.energyBalance,
    ...report.mitoROS,
    ...report.mitoNetwork,
  ];
  const concerns = allMetrics.filter((m) =>
    ["borderline", "compromised", "critical"].includes(m.rating)
  );
  const strengths = allMetrics.filter((m) => m.rating === "optimal");

  if (strengths.length > 0) {
    narrative += `**Strengths:** ${strengths.map((m) => m.name).join(", ")} — ${strengths.length === 1 ? "this is" : "these are"} performing at optimal levels.\n\n`;
  }

  if (concerns.length > 0) {
    narrative += `**Watch areas:** ${concerns.map((m) => `${m.name} (${m.rating})`).join(", ")}. These metrics suggest your mitochondria could use some support in ${concerns.length === 1 ? "this area" : "these areas"}.\n\n`;
  }

  narrative += `Think of your mitochondria as the engines inside every cell. The stronger they run, the more energy, focus, and resilience you have every day.`;

  return narrative;
}

