# Product Recommendations

Maps health traits to recommended 10X Health products. The agent should recommend products that match the user's specific trait profile — never shotgun-recommend everything.

## By Trait

### Fat Metabolism (low or moderate)
- **omega3** — 10X Omega-3 Fish Oil ($39.99) — lowers triglycerides, raises HDL
- **vitamin-d3k2** — 10X Vitamin D3 + K2 ($24.99) — anti-inflammatory, supports fat-soluble vitamin absorption

### Inflammation Tendency (moderate or high)
- **omega3** — 10X Omega-3 Fish Oil ($39.99) — potent anti-inflammatory
- **nac** — 10X NAC ($27.99) — boosts glutathione, the body's master antioxidant
- **vitamin-d3k2** — 10X Vitamin D3 + K2 ($24.99) — immune regulation

### Sleep Quality (poor or average)
- **magnesium** — 10X Magnesium Glycinate ($29.99) — calms nervous system, supports deep sleep
- **sleep-formula** — 10X Sleep Formula ($36.99) — comprehensive blend for restorative sleep

### Caffeine Sensitivity (moderate or high)
- **ashwagandha** — 10X Ashwagandha KSM-66 ($32.99) — lowers cortisol, manages stress response
- **sleep-formula** — 10X Sleep Formula ($36.99) — helps counteract caffeine's sleep impact

### Carb Tolerance (low or moderate)
- **berberine** — 10X Berberine Complex ($34.99) — clinically studied blood sugar support
- **methylated-b12** — 10X Methylated B12 ($19.99) — energy and methylation support

### Recovery Rate (slow or moderate)
- **magnesium** — 10X Magnesium Glycinate ($29.99) — muscle recovery and relaxation
- **coq10** — 10X CoQ10 Ubiquinol ($44.99) — mitochondrial energy production
- **ashwagandha** — 10X Ashwagandha KSM-66 ($32.99) — hormonal support and stress reduction
- **vitamin-d3k2** — 10X Vitamin D3 + K2 ($24.99) — recovery and immune support

## General Wellness (any user)
- **blood-panel** — 10X Comprehensive Blood Panel ($499) — full 50+ biomarker analysis
- **concierge-call** — Wellness Concierge Call (Free) — 15-minute personalized results review

## Recommendation Rules

1. Only recommend products for traits that are **not optimal** in the user's profile
2. Lead with the **most impactful** product for their specific situation
3. Maximum **one product per response** — don't overwhelm
4. Always explain **why** this product helps before showing the card
5. Mention the **price** naturally in conversation text
6. For users who seem overwhelmed, recommend the **concierge-call** instead of supplements
