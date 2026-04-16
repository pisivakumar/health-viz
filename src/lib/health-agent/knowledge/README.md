# Health Agent Knowledge Base

This directory contains all the domain knowledge that powers the 10X Health AI agent. It's split into editable markdown files so business and wellness teams can update content without touching code.

## Structure

```
knowledge/
├── traits/          # Per-trait health knowledge (6 files)
├── playbooks/       # Agent behavior rules (4 files)
├── config.json      # Metric formulas (engineering-owned)
└── README.md        # This file
```

## Traits (`traits/`)

One file per health trait. Each file has:
- **Frontmatter** (between `---` markers) — structured data used by code
- **Body** — markdown text injected into the AI agent's context

| File | Trait | What It Covers |
|------|-------|---------------|
| `caffeine-sensitivity.md` | Caffeine Sensitivity | COMT gene + cortisol → caffeine processing |
| `carb-tolerance.md` | Carb Tolerance | Blood sugar markers → carb processing |
| `fat-metabolism.md` | Fat Metabolism | Lipid panel → fat processing |
| `inflammation.md` | Inflammation Tendency | WBC + liver enzymes → systemic inflammation |
| `recovery-rate.md` | Recovery Rate | MitoScore + hormones → repair speed |
| `sleep-quality.md` | Sleep Quality | Cortisol + thyroid + genetics → sleep |

**How to edit**: Update the "Talking Points" and "What This Means" sections to change how the agent explains traits. Don't change the frontmatter or Derivation Rules unless coordinating with engineering.

## Playbooks (`playbooks/`)

These control how the agent behaves in conversations. Pure markdown — edit freely.

| File | Purpose | Loaded When |
|------|---------|-------------|
| `compliance.md` | Words to use/avoid, legal disclaimer | Every conversation |
| `cause-effects.md` | Trigger → chain → suggestion templates | When explaining why markers are off |
| `product-recommendations.md` | Which products to recommend per trait | When discussing supplements |
| `conversation-starters.md` | Common questions + ideal response patterns | Agent greeting + FAQ handling |

**How to edit**: Just update the markdown. Changes take effect on the next server restart (or next API call in development).

## Config (`config.json`)

Engineering-owned. Contains metric formulas and trait-to-number mappings used by the simulation engine. Don't edit unless you're a developer.

## Adding New Content

### New talking point for a trait
Edit the relevant `traits/*.md` file, add to the "Talking Points" section.

### New product recommendation
Edit `playbooks/product-recommendations.md`, add the product under the relevant trait section. Make sure the product exists in `src/lib/health-agent/product-catalog.ts`.

### New conversation pattern
Edit `playbooks/conversation-starters.md`, add a new section with the question and response pattern.

### New compliance rule
Edit `playbooks/compliance.md`, add to the appropriate list.
