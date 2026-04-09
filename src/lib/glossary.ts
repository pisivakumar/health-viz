/**
 * Consumer-friendly explanations for medical terms.
 *
 * Every tooltip in the app pulls from this file.
 * Written for someone with zero medical background —
 * no jargon, no acronyms left unexplained.
 */

const glossary: Record<string, string> = {
  // ── Body Systems ──────────────────────────────────────────
  thyroid:
    "A butterfly-shaped gland in your neck that controls how fast your body burns energy, makes proteins, and how sensitive your body is to other hormones. Think of it as your body's thermostat.",
  vitamins:
    "Essential nutrients your body needs in small amounts to work properly. You get most of them from food, but deficiencies are common and can cause fatigue, weakness, and other issues.",
  lipids:
    "Fats and fat-like substances in your blood. Your body needs some fat to function, but too much of certain types can clog arteries and increase heart disease risk.",
  blood:
    "Your blood carries oxygen, fights infections, and helps heal wounds. These markers tell us if your blood cells are healthy, if you have enough of them, and if they're the right size.",
  sugar_metabolism:
    "How your body processes sugar (glucose) from food and turns it into energy. Problems here can lead to diabetes, energy crashes, and weight gain.",
  liver:
    "Your liver is your body's main filter — it cleans your blood, breaks down toxins, makes proteins, and helps digest food. These markers show how well it's doing its job.",
  kidneys:
    "Your kidneys filter waste from your blood and balance your body's fluids and minerals. These markers tell us how efficiently they're working.",
  hormones:
    "Chemical messengers that travel through your blood and tell your organs what to do. They control everything from mood and energy to muscle growth and sex drive.",
  prostate:
    "A small gland in men that helps make fluid for semen. These markers screen for inflammation or other issues that might need attention.",

  // ── Health Statuses ───────────────────────────────────────
  optimal:
    "Your result is in the ideal range — exactly where your body performs best. Keep doing what you're doing.",
  "sub-optimal":
    "Your result is close to the ideal range but not quite there. Small lifestyle changes like diet, sleep, or supplements could help move this into the optimal zone.",
  "out-of-range":
    "Your result is outside the healthy range and may need attention. This doesn't mean something is wrong — it means it's worth discussing with a health professional.",

  // ── Blood Lab Biomarkers ──────────────────────────────────
  TSH: "Thyroid-Stimulating Hormone — tells your thyroid how hard to work. Too high means your thyroid is sluggish; too low means it's overactive.",
  T3: "The active thyroid hormone that directly controls your metabolism. Low T3 can make you feel tired, cold, and sluggish.",
  "Free T3":
    "The portion of T3 that's available for your body to use right now. It's the most actionable thyroid marker.",
  "Free T4":
    "The storage form of thyroid hormone. Your body converts it to T3 when it needs more energy. Think of it as fuel in the tank.",
  "Vitamin B12":
    "Essential for nerve function, making DNA, and producing red blood cells. Low B12 causes fatigue, brain fog, and tingling in hands/feet. Common in vegetarians.",
  "Vitamin D":
    "The 'sunshine vitamin' — critical for bones, immune function, and mood. Most people are deficient, especially if you spend a lot of time indoors.",
  "Total Cholesterol":
    "The total amount of cholesterol in your blood. It's not all bad — your body needs cholesterol to build cells and make hormones.",
  Triglycerides:
    "A type of fat in your blood that your body uses for energy. High levels (often from sugar, alcohol, or excess calories) increase heart disease risk.",
  "HDL Cholesterol":
    "The 'good' cholesterol — it acts like a cleanup crew, carrying bad cholesterol away from your arteries and back to the liver for disposal. Higher is better.",
  "VLDL Cholesterol":
    "Very Low-Density Lipoprotein — carries triglycerides through your blood. High levels contribute to plaque buildup in arteries.",
  "LDL Cholesterol":
    "The 'bad' cholesterol — it can build up in artery walls and form plaque, narrowing your blood vessels. Lower is generally better.",
  WBC: "White Blood Cells — your immune system's army. They fight infections and foreign invaders. High counts may mean you're fighting something; low counts may mean a weakened immune system.",
  RBC: "Red Blood Cells — they carry oxygen from your lungs to every cell in your body. Too few means anemia (fatigue, weakness); too many can thicken your blood.",
  Hemoglobin:
    "The protein inside red blood cells that actually carries the oxygen. Low hemoglobin = low oxygen delivery = fatigue and shortness of breath.",
  Hematocrit:
    "The percentage of your blood that's made up of red blood cells. Think of it as how 'thick' your blood is.",
  MCV: "Mean Corpuscular Volume — the average size of your red blood cells. Too big or too small can point to vitamin deficiencies or other conditions.",
  MCH: "Mean Corpuscular Hemoglobin — how much oxygen-carrying hemoglobin is in each red blood cell on average.",
  MCHC: "Mean Corpuscular Hemoglobin Concentration — how concentrated the hemoglobin is within each red blood cell.",
  RDW: "Red Cell Distribution Width — measures how much your red blood cells vary in size. High variation can signal nutritional deficiencies or certain blood disorders.",
  Platelets:
    "Tiny cell fragments that help your blood clot when you get a cut. Too few = excessive bleeding risk; too many = clotting risk.",
  Neutrophils:
    "The most common white blood cell — your body's first responders to bacterial infections.",
  Lymphocytes:
    "White blood cells that fight viruses and produce antibodies. They're the backbone of your adaptive immune system.",
  Monocytes:
    "White blood cells that clean up dead cells and fight chronic infections. They're like your immune system's cleanup crew.",
  Eosinophils:
    "White blood cells that fight parasites and play a role in allergic reactions. Elevated levels may signal allergies or asthma.",
  Basophils:
    "The rarest white blood cells — involved in allergic reactions and inflammation. Usually very low in number.",
  Glucose:
    "Blood sugar — your body's primary fuel source. Measured after fasting to see your baseline. High glucose over time can lead to diabetes.",
  HbA1c:
    "Your 3-month average blood sugar level. Unlike glucose (a snapshot), HbA1c shows the bigger picture of how well your body manages sugar over time.",
  Insulin:
    "The hormone that moves sugar from your blood into your cells for energy. High insulin (even with normal glucose) can be an early warning sign for diabetes.",
  "Total Protein":
    "The total amount of protein in your blood, including albumin and globulin. Important for immune function, blood clotting, and fighting infection.",
  Albumin:
    "A protein made by your liver that keeps fluid in your bloodstream and carries hormones, vitamins, and drugs throughout your body.",
  "Total Globulin":
    "A group of proteins including antibodies. Important for immune function and fighting infections.",
  Globulin:
    "A group of proteins including antibodies. Important for immune function and fighting infections.",
  "Total Bilirubin":
    "A yellow substance produced when red blood cells break down. Your liver processes it. High levels can cause jaundice (yellowing of skin/eyes).",
  Bilirubin:
    "A yellow substance produced when red blood cells break down. Your liver processes it. High levels can cause jaundice (yellowing of skin/eyes).",
  ALP: "Alkaline Phosphatase — an enzyme found mainly in your liver and bones. Elevated levels may indicate liver or bone issues.",
  AST: "Aspartate Aminotransferase — an enzyme found in your liver and heart. Elevated AST can indicate liver damage, but it can also rise after intense exercise.",
  ALT: "Alanine Aminotransferase — an enzyme specific to your liver. It's the most reliable marker for liver inflammation or damage.",
  BUN: "Blood Urea Nitrogen — a waste product filtered by your kidneys. High levels may mean your kidneys aren't filtering as well as they should.",
  Creatinine:
    "A waste product from muscle metabolism that your kidneys filter out. High levels suggest your kidneys may be under strain.",
  eGFR: "Estimated Glomerular Filtration Rate — the gold standard for measuring kidney function. It estimates how much blood your kidneys filter per minute. Higher is better.",
  Sodium:
    "An electrolyte that helps control fluid balance and blood pressure. Your body tightly regulates it — even small changes can affect how you feel.",
  Potassium:
    "An electrolyte critical for heart rhythm and muscle function. Too high or too low can cause dangerous heart issues.",
  Chloride:
    "An electrolyte that works with sodium to maintain fluid balance and acid-base balance in your body.",
  CO2: "Carbon Dioxide (bicarbonate) — helps maintain your blood's pH balance. Abnormal levels can indicate breathing or kidney issues.",
  Calcium:
    "Essential for strong bones, muscle contractions, nerve signaling, and heart rhythm. Your body keeps blood calcium levels very tightly controlled.",
  Cortisol:
    "Your primary stress hormone. It's essential in the right amounts — it helps you wake up, handle stress, and fight inflammation. Chronically high levels damage your health.",
  "IGF-1":
    "Insulin-like Growth Factor 1 — a hormone that promotes cell growth and repair. It's closely tied to growth hormone and is important for muscle building and recovery.",
  Testosterone:
    "The primary male sex hormone (women have it too, in smaller amounts). Controls muscle mass, bone density, sex drive, energy, and mood.",
  "Free Testosterone":
    "The portion of testosterone that's unbound and available for your body to use immediately. Total testosterone can look normal even when free testosterone is low.",
  LH: "Luteinizing Hormone — signals your body to produce sex hormones. In men, it triggers testosterone production. Important for fertility and hormonal balance.",
  FSH: "Follicle-Stimulating Hormone — works with LH to regulate reproductive function. In men, it's essential for sperm production.",
  "DHEA-Sulfate":
    "A hormone produced by your adrenal glands that your body converts into testosterone and estrogen. Often called the 'youth hormone' because levels decline with age.",
  SHBG: "Sex Hormone-Binding Globulin — a protein that binds to sex hormones and controls how much is available for your body to use. High SHBG means less free testosterone.",
  Estradiol:
    "The primary form of estrogen. Men need some for bone health and brain function, but too much can cause issues like weight gain and mood changes.",
  PSA: "Prostate-Specific Antigen — a protein produced by the prostate gland. Elevated levels can indicate prostate inflammation, enlargement, or in some cases, cancer. Used as a screening tool.",
  "Free PSA":
    "The percentage of PSA that's unbound in your blood. Helps distinguish between benign prostate issues and potential cancer when total PSA is elevated.",

  // ── Genetic Methylation ───────────────────────────────────
  MTHFR:
    "A gene that makes an enzyme your body needs to process folate (vitamin B9) and regulate homocysteine. Variants can affect mood, energy, detox ability, and gut health.",
  MTR: "Methionine Synthase — a gene involved in converting homocysteine back to methionine (an essential amino acid). Variants can cause digestive issues like gas, bloating, and irregular bowel movements.",
  MTRR: "Methionine Synthase Reductase — works with MTR to keep the methylation cycle running smoothly. Variants can contribute to heartburn, acid reflux, and thyroid issues.",
  AHCY: "A gene that breaks down homocysteine. Variants are rare but can be linked to addictive tendencies and high blood pressure.",
  COMT: "Catechol-O-Methyltransferase — a gene that breaks down neurotransmitters like dopamine and adrenaline. Variants can affect focus, sleep, and stress response (linked to ADD/ADHD and OCD).",
  methylation:
    "A chemical process that happens billions of times per second in your body. It controls how your genes turn on and off, how you detox, how you make energy, and how you process emotions. Think of it as your body's operating system.",
  "enzyme activity":
    "How well a gene's enzyme does its job. 'Normal' means it works as expected. 'Reduced' means it works slower. 'Significantly reduced' means it's working much slower than normal, which may cause symptoms.",
  "Homozygous Negative":
    "You inherited zero copies of this variant — one normal copy from each parent. Your enzyme works at full speed. This is the best result.",
  Heterozygous:
    "You inherited one copy of the variant (from one parent) and one normal copy (from the other). Your enzyme works, but at reduced speed — typically 30-70% of normal.",
  "Homozygous Positive":
    "You inherited two copies of the variant — one from each parent. Your enzyme works at significantly reduced speed, which is more likely to cause noticeable symptoms.",
  "variant count":
    "The number of gene variant copies you carry: 0 = none (normal), 1 = one copy (reduced function), 2 = two copies (significantly reduced function).",

  // ── MitoScreen ────────────────────────────────────────────
  MitoScore:
    "Your overall mitochondrial health score on a 0-100 scale, compared to the general population. Mitochondria are the 'power plants' inside every cell — they make the energy that keeps you alive.",
  "Baseline Respiration":
    "How much energy your mitochondria produce when you're at rest. Think of it as your engine's idle speed. Higher means your cells have a strong, efficient energy baseline.",
  "Mitochondrial Efficiency":
    "How well your mitochondria convert fuel (food) into usable energy without wasting it. Like a car's miles-per-gallon — higher efficiency means less energy is lost as heat.",
  "Mitochondrial Potential":
    "The electrical charge across the mitochondrial membrane — essentially how 'charged up' your cellular batteries are. Higher potential means more energy capacity available when you need it.",
  "Mitochondrial Energy":
    "The proportion of your energy that comes from mitochondria (the efficient pathway) versus other sources. More mitochondrial energy = better endurance and sustained performance.",
  "Glycolysis Energy":
    "Energy produced by breaking down glucose without using mitochondria — a fast but inefficient backup system. Like burning kindling instead of logs. Over-reliance on this pathway can indicate mitochondrial stress.",
  "Baseline ROS":
    "Reactive Oxygen Species at rest — essentially 'exhaust fumes' from energy production. Some ROS is normal and even helpful, but too much causes oxidative stress that damages cells and accelerates aging.",
  "Stressed ROS":
    "How much oxidative stress your cells produce when under pressure. Lower is better — it means your mitochondria handle stress without producing excessive damaging byproducts.",
  "Baseline Mito-Network":
    "How interconnected your mitochondrial network is at rest. Mitochondria aren't isolated — they fuse together into networks to share resources. A highly connected network means better energy distribution.",
  "Stressed Mito-Network":
    "How well your mitochondrial network holds together under stress. A network that stays connected under pressure means your cells can maintain energy flow even in demanding situations.",
  "High Function with Growth Potential":
    "Your mitochondria are performing well overall, but there are specific areas where targeted improvements (like exercise, diet, or supplements) could significantly boost your cellular energy.",
  "energy profile":
    "A snapshot of how your mitochondria produce energy — including how much they make at rest, how efficiently they work, and how much reserve capacity they have.",
  "energy balance":
    "The ratio between energy from mitochondria (efficient) and energy from glycolysis (quick but wasteful). Healthy cells rely primarily on mitochondrial energy.",

  // ── MitoScreen Ratings ────────────────────────────────────
  stable:
    "Your result is in a good, functional range — not yet optimal but performing reliably. With targeted support, this can improve.",
  borderline:
    "Your result is at the edge of the healthy range and may benefit from attention. Not alarming, but worth monitoring and potentially addressing with lifestyle changes.",
  compromised:
    "Your result indicates this system is struggling and likely affecting your energy, recovery, or wellbeing. Targeted intervention is recommended.",
  critical:
    "Your result is significantly outside the healthy range and needs priority attention. This is likely impacting your daily energy and health.",

  // ── General Medical Terms ─────────────────────────────────
  biomarker:
    "A measurable indicator of what's happening inside your body — like a dashboard light in a car. Each biomarker tells a specific story about a body system.",
  "optimal range":
    "The range where your body performs at its best — not just 'normal' by lab standards, but where you actually feel and function your best. 10X uses tighter, evidence-based optimal ranges.",
  "reference range":
    "The standard lab range based on the general population. It tells you if you're 'normal,' but normal includes a lot of unhealthy people. 10X's optimal range is more precise.",
  percentile:
    "Where you rank compared to others. The 77th percentile means you scored higher than 77% of people tested.",
  "supplement protocol":
    "A personalized plan of vitamins, minerals, or other supplements designed to address your specific genetic and biomarker results.",
};

export default glossary;

const lowerMap = new Map(
  Object.entries(glossary).map(([k, v]) => [k.toLowerCase(), v])
);

/**
 * Look up a term in the glossary (case-insensitive).
 * Returns the explanation or null if not found.
 */
export function lookupTerm(term: string): string | null {
  return glossary[term] ?? lowerMap.get(term.toLowerCase()) ?? null;
}
