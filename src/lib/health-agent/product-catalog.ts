/**
 * 10X Health Product Catalog.
 *
 * Real products from the 10X Health Shopify store.
 * Maps products to health traits so the agent recommends contextually.
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  tagline: string;
  price: string;
  url: string;
  imageUrl?: string;
  category: "supplement" | "test" | "bundle" | "consultation";
  relatedTraits: string[];
}

export const PRODUCT_CATALOG: Product[] = [
  // ── Core Supplements ──
  {
    id: "magnesium",
    name: "10X Magnesium",
    description: "Magnesium supplement for sleep quality, stress reduction, and muscle recovery.",
    tagline: "Better sleep and lower stress",
    price: "$18.00",
    url: "https://shop.10xhealthsystem.com/products/10x-magnesium",
    category: "supplement",
    relatedTraits: ["sleep_quality_tendency", "recovery_rate"],
  },
  {
    id: "sleep-formula",
    name: "10X Sleep Formula",
    description: "Comprehensive sleep support blend for deep, restorative sleep without grogginess.",
    tagline: "Fall asleep faster, wake up refreshed",
    price: "$36.00",
    url: "https://shop.10xhealthsystem.com/products/sleep-formula-1",
    category: "supplement",
    relatedTraits: ["sleep_quality_tendency", "caffeine_sensitivity"],
  },
  {
    id: "berberine",
    name: "10X Berberine",
    description: "Clinically studied berberine for blood sugar management and metabolic health.",
    tagline: "Healthy blood sugar and metabolism",
    price: "$40.00",
    url: "https://shop.10xhealthsystem.com/products/berberine",
    category: "supplement",
    relatedTraits: ["carb_tolerance"],
  },
  {
    id: "d3-k2",
    name: "10X D3+K2",
    description: "Vitamin D3 with K2 for immune function, bone health, and calcium optimization.",
    tagline: "Immune support and bone strength",
    price: "$30.00",
    url: "https://shop.10xhealthsystem.com/products/10x-d3-k2",
    category: "supplement",
    relatedTraits: ["recovery_rate", "inflammation_tendency"],
  },
  {
    id: "5-mthf",
    name: "10X 5-MTHF",
    description: "Active methylfolate for methylation support, energy, and mood — especially important for MTHFR variants.",
    tagline: "Methylation and energy support",
    price: "$22.00",
    url: "https://shop.10xhealthsystem.com/products/10x-5-mthf",
    category: "supplement",
    relatedTraits: ["recovery_rate", "sleep_quality_tendency"],
  },
  {
    id: "calm",
    name: "10X Calm",
    description: "Stress and cortisol management formula for a calmer, more focused state.",
    tagline: "Stress relief and hormonal balance",
    price: "$40.00",
    url: "https://shop.10xhealthsystem.com/products/10x-calm",
    category: "supplement",
    relatedTraits: ["caffeine_sensitivity", "sleep_quality_tendency"],
  },
  {
    id: "alpha",
    name: "10X Alpha",
    description: "Hormone optimization support for testosterone, energy, and recovery.",
    tagline: "Hormonal support and vitality",
    price: "$40.00",
    url: "https://shop.10xhealthsystem.com/products/10x-alpha-v2",
    category: "supplement",
    relatedTraits: ["recovery_rate"],
  },
  {
    id: "focus",
    name: "10X Focus",
    description: "Cognitive performance formula for mental clarity, focus, and brain health.",
    tagline: "Sharp focus and mental clarity",
    price: "$36.00",
    url: "https://shop.10xhealthsystem.com/products/10x-focus",
    category: "supplement",
    relatedTraits: ["caffeine_sensitivity"],
  },
  {
    id: "vitamin-c",
    name: "10X Vitamin C",
    description: "High-potency vitamin C for immune support and antioxidant protection.",
    tagline: "Immune defense and antioxidant support",
    price: "$16.00",
    url: "https://shop.10xhealthsystem.com/products/10x-vitamin-c",
    category: "supplement",
    relatedTraits: ["inflammation_tendency", "recovery_rate"],
  },
  {
    id: "zinc",
    name: "10X Zinc",
    description: "Essential zinc for immune function, testosterone support, and recovery.",
    tagline: "Immune and hormonal support",
    price: "$17.00",
    url: "https://shop.10xhealthsystem.com/products/10x-zinc",
    category: "supplement",
    relatedTraits: ["recovery_rate", "inflammation_tendency"],
  },
  {
    id: "tmg",
    name: "10X TMG",
    description: "Trimethylglycine for methylation, homocysteine management, and liver support.",
    tagline: "Methylation and liver support",
    price: "$17.00",
    url: "https://shop.10xhealthsystem.com/products/10x-tmg",
    category: "supplement",
    relatedTraits: ["inflammation_tendency"],
  },
  {
    id: "probiotic",
    name: "10X Probiotic",
    description: "Multi-strain probiotic for gut health, digestion, and immune support.",
    tagline: "Gut health and digestion",
    price: "$26.00",
    url: "https://shop.10xhealthsystem.com/products/10x-probiotic",
    category: "supplement",
    relatedTraits: ["inflammation_tendency"],
  },
  {
    id: "turmeric",
    name: "10X Turmeric Curcumin",
    description: "High-potency turmeric curcumin for anti-inflammatory and antioxidant support.",
    tagline: "Powerful anti-inflammatory support",
    price: "$42.00",
    url: "https://shop.10xhealthsystem.com/products/10x-turmeric-curcumin",
    category: "supplement",
    relatedTraits: ["inflammation_tendency", "fat_metabolism"],
  },
  {
    id: "colostrum",
    name: "10X Colostrum",
    description: "Bovine colostrum for gut lining support, immune function, and recovery.",
    tagline: "Gut and immune recovery",
    price: "$40.00",
    url: "https://shop.10xhealthsystem.com/products/10x-colostrum-1",
    category: "supplement",
    relatedTraits: ["inflammation_tendency", "recovery_rate"],
  },
  {
    id: "neuro-medulla",
    name: "10X Neuro Medulla",
    description: "Neurological support complex for brain health, mood, and cognitive function.",
    tagline: "Brain health and mood support",
    price: "$30.00",
    url: "https://shop.10xhealthsystem.com/products/neuro-medulla",
    category: "supplement",
    relatedTraits: ["caffeine_sensitivity", "sleep_quality_tendency"],
  },
  {
    id: "methylene-blue",
    name: "10X Methylene Blue Drops",
    description: "Pharmaceutical-grade methylene blue for mitochondrial support and cellular energy.",
    tagline: "Mitochondrial energy and brain health",
    price: "$39.00",
    url: "https://shop.10xhealthsystem.com/products/10x-methylene-blue-drops",
    category: "supplement",
    relatedTraits: ["recovery_rate"],
  },
  {
    id: "coq10",
    name: "Red Yeast Rice + CoQ10",
    description: "Heart health formula combining red yeast rice with CoQ10 for cardiovascular support.",
    tagline: "Heart health and cholesterol support",
    price: "$40.00",
    url: "https://shop.10xhealthsystem.com/products/red-yeast-rice-coq10",
    category: "supplement",
    relatedTraits: ["fat_metabolism", "recovery_rate"],
  },
  {
    id: "optimize",
    name: "10X Optimize",
    description: "Comprehensive daily optimization formula based on your methylation genetics.",
    tagline: "Your personalized daily foundation",
    price: "$44.00",
    url: "https://shop.10xhealthsystem.com/products/10x-optimize",
    category: "supplement",
    relatedTraits: ["recovery_rate", "inflammation_tendency"],
  },
  {
    id: "collagen",
    name: "10X Collagen Peptides",
    description: "Premium collagen peptides for skin, joint, and connective tissue support.",
    tagline: "Skin, joints, and recovery",
    price: "$44.95",
    url: "https://shop.10xhealthsystem.com/products/10x-collagen-peptides",
    category: "supplement",
    relatedTraits: ["recovery_rate"],
  },
  {
    id: "precision-aminos",
    name: "10X Precision Aminos",
    description: "Essential amino acid complex for muscle recovery, energy, and performance.",
    tagline: "Muscle recovery and performance",
    price: "$135.00",
    url: "https://shop.10xhealthsystem.com/products/10x-precision-aminos",
    category: "supplement",
    relatedTraits: ["recovery_rate"],
  },

  // ── Bundles ──
  {
    id: "precision-nutrition",
    name: "10X Precision Nutrition Supplements",
    description: "Complete personalized supplement stack based on your genetic and blood test results.",
    tagline: "Your full personalized protocol",
    price: "$989.00",
    url: "https://shop.10xhealthsystem.com/products/10x-precision-nutrition-supplements",
    category: "bundle",
    relatedTraits: [],
  },

  // ── Tests ──
  {
    id: "blood-test",
    name: "10X Health Blood Test",
    description: "Comprehensive blood panel covering 50+ biomarkers with optimal range assessment.",
    tagline: "Know exactly where you stand",
    price: "$599.00",
    url: "https://shop.10xhealthsystem.com/products/10x-health-blood-test",
    category: "test",
    relatedTraits: ["carb_tolerance", "fat_metabolism", "inflammation_tendency"],
  },
  {
    id: "genetic-test",
    name: "10X Health Genetic Test",
    description: "5-gene methylation panel revealing how your genetics affect mood, energy, digestion, and sleep.",
    tagline: "Unlock your genetic blueprint",
    price: "$599.00",
    url: "https://shop.10xhealthsystem.com/products/10x-health-genetic-test-1",
    category: "test",
    relatedTraits: ["caffeine_sensitivity", "sleep_quality_tendency"],
  },
  {
    id: "methylation-test",
    name: "10X Methylation Genetic Test",
    description: "Advanced methylation genetic testing for personalized supplement protocols.",
    tagline: "Precision genetics for your protocol",
    price: "$599.00",
    url: "https://shop.10xhealthsystem.com/products/10x-methylation-genetic-test",
    category: "test",
    relatedTraits: ["caffeine_sensitivity", "sleep_quality_tendency"],
  },
  {
    id: "mito-test",
    name: "MeScreen Mitochondrial Function Test",
    description: "Advanced mitochondrial function testing to assess cellular energy production and health.",
    tagline: "Measure your cellular energy",
    price: "$699.00",
    url: "https://shop.10xhealthsystem.com/products/mescreen-mitochondrial-function-test-healthcare-provider",
    category: "test",
    relatedTraits: ["recovery_rate"],
  },
  {
    id: "gut-test",
    name: "The 10X Gut Health Test",
    description: "Comprehensive gut microbiome analysis for digestive health and immune optimization.",
    tagline: "Understand your gut microbiome",
    price: "$699.00",
    url: "https://shop.10xhealthsystem.com/products/the-10x-gut-health-test-powered-by-kbmo",
    category: "test",
    relatedTraits: ["inflammation_tendency"],
  },
];

/**
 * Look up a product by ID.
 */
export function getProduct(id: string): Product | undefined {
  return PRODUCT_CATALOG.find((p) => p.id === id);
}

/**
 * Find products relevant to a specific health trait.
 */
export function getProductsForTrait(traitId: string): Product[] {
  return PRODUCT_CATALOG.filter((p) => p.relatedTraits.includes(traitId));
}

/**
 * Get catalog summary for LLM context (compact format).
 */
export function getCatalogSummary(): string {
  return PRODUCT_CATALOG.map(
    (p) => `- ${p.id}: "${p.name}" (${p.price}) — ${p.tagline}. Supports: ${p.relatedTraits.join(", ") || "general"}`
  ).join("\n");
}
