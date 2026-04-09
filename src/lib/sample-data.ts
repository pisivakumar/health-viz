/**
 * Sample data extracted from Alexander Brooks' obfuscated test reports.
 * In production, this comes from the PDF extraction API.
 */
import type {
  BloodLabReport,
  GeneticReport,
  MitoScreenReport,
} from "./types";
import { BODY_SYSTEM_MAP } from "./types";
import { computeBiomarkerStatus, computeSystemScore, computeSystemStatus } from "./theme";

// Raw biomarker data from the blood lab PDF
const rawBiomarkers = {
  thyroid: [
    { name: "TSH", value: 1.93, unit: "mIU/L", optimalMin: 0.5, optimalMax: 2 },
    { name: "T3", value: 91, unit: "ng/dL", optimalMin: 100, optimalMax: 179 },
    { name: "Free T3", value: 3.5, unit: "pg/mL", optimalMin: 3.2, optimalMax: 4.5 },
    { name: "Free T4", value: 1.72, unit: "ng/dL", optimalMin: 1.5, optimalMax: 2.0 },
  ],
  vitamins: [
    { name: "Vitamin B12", value: 767, unit: "pg/mL", optimalMin: 800, optimalMax: 2000 },
    { name: "Vitamin D", value: 76, unit: "ng/mL", optimalMin: 60, optimalMax: 99 },
  ],
  lipids: [
    { name: "Total Cholesterol", value: 149, unit: "mg/dL", optimalMin: 140, optimalMax: 224 },
    { name: "Triglycerides", value: 77, unit: "mg/dL", optimalMin: 50, optimalMax: 100 },
    { name: "HDL Cholesterol", value: 49, unit: "mg/dL", optimalMin: 40, optimalMax: 80 },
    { name: "VLDL Cholesterol", value: 15, unit: "mg/dL", optimalMin: 5, optimalMax: 31 },
    { name: "LDL Cholesterol", value: 85, unit: "mg/dL", optimalMin: 30, optimalMax: 99 },
  ],
  blood: [
    { name: "WBC", value: 5.4, unit: "K/uL", optimalMin: 5, optimalMax: 8 },
    { name: "RBC", value: 5.39, unit: "M/uL", optimalMin: 4.39, optimalMax: 5.7 },
    { name: "Hemoglobin", value: 17.0, unit: "g/dL", optimalMin: 14, optimalMax: 16.5 },
    { name: "Hematocrit", value: 50.3, unit: "%", optimalMin: 40, optimalMax: 49.5 },
    { name: "MCV", value: 93, unit: "fL", optimalMin: 86, optimalMax: 95.5 },
    { name: "Platelets", value: 244, unit: "K/uL", optimalMin: 155, optimalMax: 379 },
    { name: "RDW", value: 11.8, unit: "%", optimalMin: 12, optimalMax: 14.5 },
  ],
  sugar_metabolism: [
    { name: "Glucose", value: 90, unit: "mg/dL", optimalMin: 70, optimalMax: 89 },
    { name: "HbA1c", value: 5.1, unit: "%", optimalMin: 4.8, optimalMax: 5.4 },
    { name: "Insulin", value: 4.6, unit: "uIU/mL", optimalMin: 2, optimalMax: 10 },
  ],
  liver: [
    { name: "Total Protein", value: 7.3, unit: "g/dL", optimalMin: 6.6, optimalMax: 8 },
    { name: "Albumin", value: 4.8, unit: "g/dL", optimalMin: 4, optimalMax: 5 },
    { name: "Total Globulin", value: 2.5, unit: "g/dL", optimalMin: 2.4, optimalMax: 2.8 },
    { name: "Total Bilirubin", value: 0.8, unit: "mg/dL", optimalMin: 0.2, optimalMax: 1.2 },
    { name: "ALP", value: 88, unit: "U/L", optimalMin: 44, optimalMax: 100 },
    { name: "AST", value: 26, unit: "U/L", optimalMin: 10, optimalMax: 26 },
    { name: "ALT", value: 21, unit: "U/L", optimalMin: 10, optimalMax: 26 },
  ],
  kidneys: [
    { name: "BUN", value: 14, unit: "mg/dL", optimalMin: 10, optimalMax: 20 },
    { name: "Creatinine", value: 1.26, unit: "mg/dL", optimalMin: 0.6, optimalMax: 1.5 },
    { name: "eGFR", value: 79, unit: "mL/min", optimalMin: 90, optimalMax: 999 },
    { name: "Sodium", value: 141, unit: "mEq/L", optimalMin: 137, optimalMax: 141 },
    { name: "Potassium", value: 4.2, unit: "mEq/L", optimalMin: 4, optimalMax: 5 },
    { name: "Calcium", value: 9.8, unit: "mg/dL", optimalMin: 9, optimalMax: 10 },
  ],
  hormones: [
    { name: "Cortisol", value: 13, unit: "ug/dL", optimalMin: 9, optimalMax: 16 },
    { name: "IGF-1", value: 196, unit: "ng/mL", optimalMin: 175, optimalMax: 350 },
    { name: "Testosterone", value: 998, unit: "ng/dL", optimalMin: 600, optimalMax: 1199 },
    { name: "Free Testosterone", value: 26.6, unit: "pg/mL", optimalMin: 18, optimalMax: 32 },
    { name: "LH", value: 10.6, unit: "mIU/mL", optimalMin: 5, optimalMax: 6.9 },
    { name: "DHEA-Sulfate", value: 591, unit: "ug/dL", optimalMin: 300, optimalMax: 550 },
    { name: "Estradiol", value: 19.8, unit: "pg/mL", optimalMin: 12.1, optimalMax: 50.99 },
  ],
  prostate: [
    { name: "PSA", value: 0.6, unit: "ng/mL", optimalMin: 0, optimalMax: 2.6 },
  ],
};


function buildSystems() {
  return Object.entries(rawBiomarkers).map(([key, markers]) => {
    const biomarkers = markers.map((m) => ({
      ...m,
      status: computeBiomarkerStatus(m.value, m.optimalMin, m.optimalMax),
    }));
    const score = computeSystemScore(markers);
    return {
      id: key,
      name: BODY_SYSTEM_MAP[key].label,
      bodyPart: BODY_SYSTEM_MAP[key].bodyPart,
      biomarkers,
      overallStatus: computeSystemStatus(score),
      score,
    };
  });
}

export const sampleBloodLab: BloodLabReport = {
  type: "blood-lab",
  patient: {
    name: "Alexander Brooks",
    dateOfBirth: "8/20/1995",
    gender: "Male",
    age: 29,
    testDate: "10/28/2024",
  },
  systems: buildSystems(),
};

export const sampleGenetic: GeneticReport = {
  type: "genetic",
  patient: {
    name: "Alexander Brooks",
    dateOfBirth: "8/20/1995",
    testDate: "8/6/2024",
  },
  genes: [
    {
      id: "mthfr",
      name: "MTHFR",
      affectedBodyPart: "Mind and Gut",
      symptoms: [
        "Anxiety",
        "Depression",
        "Panic Attacks",
        "Gut issues",
        "Poor sleep",
      ],
      variants: [
        {
          subAllele: "C677T",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants. Enzyme activity normal.",
        },
        {
          subAllele: "A1298C",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants. Enzyme activity normal.",
        },
      ],
      enzymeActivity: "normal",
      description:
        "MTHFR is very early in the methylation cycle and can have the greatest impact on all gene mutations.",
    },
    {
      id: "mtr",
      name: "MTR",
      affectedBodyPart: "Lower Gut",
      symptoms: ["Gas", "Bloating", "Diarrhea", "Constipation", "Cramping"],
      variants: [
        {
          subAllele: "A2756G",
          result: "Heterozygous",
          variantCount: 1,
          description:
            "One parent passed a variant. Enzyme activity tends to be reduced.",
        },
        {
          subAllele: "C3518T",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants. Enzyme activity normal.",
        },
      ],
      enzymeActivity: "reduced",
      description:
        "People with this mutation experience gas, bloating, diarrhea, and constipation.",
    },
    {
      id: "mtrr",
      name: "MTRR",
      affectedBodyPart: "Upper Gut",
      symptoms: ["Heartburn", "Acid Reflux", "Thyroid Issues", "Short Temper"],
      variants: [
        {
          subAllele: "A66G",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants. Enzyme activity normal.",
        },
      ],
      enzymeActivity: "normal",
      description:
        "People with this mutation experience heartburn and acid reflux.",
    },
    {
      id: "ahcy",
      name: "AHCY",
      affectedBodyPart: "Mind",
      symptoms: ["Addictive tendencies"],
      variants: [
        {
          subAllele: "C112T",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants.",
        },
        {
          subAllele: "G367A",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants.",
        },
      ],
      enzymeActivity: "normal",
      description:
        "This mutation is rare and may include addictive tendencies and hypertension.",
    },
    {
      id: "comt",
      name: "COMT",
      affectedBodyPart: "Mind",
      symptoms: ["ADD/ADHD", "OCD", "Racing Thoughts", "Poor Sleep"],
      variants: [
        {
          subAllele: "G304A",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants.",
        },
        {
          subAllele: "G472A",
          result: "Homozygous Negative",
          variantCount: 0,
          description: "No variants.",
        },
      ],
      enzymeActivity: "normal",
      description:
        "People with this mutation tend to experience ADD/ADHD, OCD, racing thoughts, and poor sleep.",
    },
  ],
  supplementProtocol: "10X Optimize - Based on weight dosing protocol",
};

export const sampleMitoScreen: MitoScreenReport = {
  type: "mitoscreen",
  patient: {
    name: "Alexander Brooks",
    testDate: "03/06/2026",
  },
  mitoScore: 77,
  profileType: "High Function with Growth Potential",
  energyProfile: [
    { name: "Baseline Respiration", rating: "optimal", score: 85, description: "Balanced rate of energy production at rest." },
    { name: "Mitochondrial Efficiency", rating: "optimal", score: 80, description: "Excellent energy conservation, minimizing unnecessary loss." },
    { name: "Mitochondrial Potential", rating: "stable", score: 63, description: "Healthy baseline potential with some room to grow." },
  ],
  energyBalance: [
    { name: "Mitochondrial Energy", rating: "optimal", score: 68, description: "Cells rely primarily on efficient mitochondrial production." },
    { name: "Glycolysis Energy", rating: "stable", score: 57, description: "Consistent glucose conversion for short-term needs." },
  ],
  mitoROS: [
    { name: "Baseline ROS", rating: "borderline", score: 62, description: "Slightly elevated ROS at rest, suggesting early oxidative stress." },
    { name: "Stressed ROS", rating: "stable", score: 50, description: "Well-controlled ROS under stress." },
  ],
  mitoNetwork: [
    { name: "Baseline Mito-Network", rating: "optimal", score: 70, description: "Highly interconnected at rest." },
    { name: "Stressed Mito-Network", rating: "optimal", score: 40, description: "Remains responsive under stress." },
  ],
};
