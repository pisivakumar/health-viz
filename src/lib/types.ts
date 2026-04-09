// ============================================================
// 10X Health Report Data Model
// Supports: Blood Lab, Genetic Methylation, MitoScreen
// ============================================================

export type HealthStatus = "optimal" | "sub-optimal" | "out-of-range";

// --- Blood Lab Report ---

export interface Biomarker {
  name: string;
  value: number;
  unit: string;
  optimalMin: number;
  optimalMax: number;
  referenceMin?: number;
  referenceMax?: number;
  status: HealthStatus;
}

export interface BodySystem {
  id: string;
  name: string;
  bodyPart: BodyPartId;
  biomarkers: Biomarker[];
  overallStatus: HealthStatus;
  score: number; // 0-100, derived from % of biomarkers in optimal range
}

export interface BloodLabReport {
  type: "blood-lab";
  patient: PatientInfo;
  systems: BodySystem[];
}

// --- Genetic Methylation Report ---

export type VariantCount = 0 | 1 | 2;
export type EnzymeActivity = "normal" | "reduced" | "significantly-reduced";

export interface GeneVariant {
  subAllele: string;
  result: string; // e.g., "Homozygous Negative", "Heterozygous"
  variantCount: VariantCount;
  description: string;
}

export interface Gene {
  id: string;
  name: string; // MTHFR, MTR, MTRR, AHCY, COMT
  affectedBodyPart: string; // Mind, Lower Gut, Upper Gut, Mind
  symptoms: string[];
  variants: GeneVariant[];
  enzymeActivity: EnzymeActivity;
  description: string;
}

export interface GeneticReport {
  type: "genetic";
  patient: PatientInfo;
  genes: Gene[];
  supplementProtocol: string;
}

// --- MitoScreen Report ---

export type MitoRating =
  | "optimal"
  | "stable"
  | "borderline"
  | "compromised"
  | "critical";

export interface MitoMetric {
  name: string;
  rating: MitoRating;
  score: number; // raw score
  description: string;
}

export interface MitoScreenReport {
  type: "mitoscreen";
  patient: PatientInfo;
  mitoScore: number; // 0-100 percentile
  profileType: string; // e.g., "High Function with Growth Potential"
  energyProfile: MitoMetric[];
  energyBalance: MitoMetric[];
  mitoROS: MitoMetric[];
  mitoNetwork: MitoMetric[];
}

// --- Common ---

export interface PatientInfo {
  name: string;
  dateOfBirth?: string;
  gender?: string;
  age?: number;
  testDate: string;
}

export type HealthReport = BloodLabReport | GeneticReport | MitoScreenReport;

// --- Supplement Cart Item ---

export interface CartItem {
  systemName: string;
  rec: {
    title: string;
    description: string;
    type: "supplement" | "lifestyle" | "test" | "consult";
    impact: "high" | "medium" | "low";
  };
}

// --- Body Part Mapping (static, no AI needed) ---

export type BodyPartId =
  | "brain"
  | "thyroid"
  | "heart"
  | "lungs"
  | "liver"
  | "kidneys"
  | "gut"
  | "blood"
  | "hormones"
  | "prostate"
  | "cell"
  | "full-body";

export const BODY_SYSTEM_MAP: Record<
  string,
  { bodyPart: BodyPartId; label: string; radarAxis: string }
> = {
  thyroid: { bodyPart: "thyroid", label: "Thyroid", radarAxis: "Thyroid" },
  vitamins: { bodyPart: "full-body", label: "Vitamins", radarAxis: "Vitamins" },
  lipids: { bodyPart: "heart", label: "Lipids", radarAxis: "Lipids" },
  blood: { bodyPart: "blood", label: "Blood", radarAxis: "Blood" },
  sugar_metabolism: {
    bodyPart: "full-body",
    label: "Sugar Metabolism",
    radarAxis: "Sugar",
  },
  liver: { bodyPart: "liver", label: "Liver", radarAxis: "Liver" },
  kidneys: { bodyPart: "kidneys", label: "Kidneys", radarAxis: "Kidneys" },
  hormones: {
    bodyPart: "hormones",
    label: "Hormones",
    radarAxis: "Hormones",
  },
  prostate: { bodyPart: "prostate", label: "Prostate", radarAxis: "Prostate" },
};
