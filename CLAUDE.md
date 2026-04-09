@AGENTS.md

# 10X Health Interactive Report Visualization

## Quick Start
```bash
npm run dev   # http://localhost:3000
npm run build # production build
```

## E2E Testing (REQUIRED before claiming anything works)
```bash
node e2e-option-c.mjs       # full test suite (21 checks)
node e2e-click-accuracy.mjs  # radar click accuracy (9 systems)
```
Requires: `npm install --save-dev playwright && npx playwright install chromium`

## Architecture
- **Next.js 16** with Turbopack, Tailwind v4, React 19
- **Light theme** — white bg, black text, 10X brand red (#D1242A) accents
- **Fonts** — Oswald (headings, uppercase) + Inter (body) via Google Fonts
- **Brand files** at `/Users/prasannasivakumar/work/testreports/10x-brand-theme.json`, `10x-brand-theme.css`, `10X_STYLE_GUIDE.md`

## Key Patterns
- **Radar chart click** uses angle math from chart center to identify system. `pointer-events: none` on ECharts SVG, native click on wrapper div.
- **Upsell flow**: click system → detail card with recommendations + "Get supplements" CTA → SupplementCart modal
- **Passive upsell strip**: always visible below radar for non-optimal systems + "Get My Improvement Plan" CTA
- **InfoTips**: `<span role="button">` (not `<button>`) to avoid hydration errors when nested inside clickable cards
- **No animation initial states that hide content** — removed `motion.div initial={{ opacity: 0 }}` wrappers that caused invisible content on hydration failure

## What NOT to do
- Don't add separate mode toggles (goal setter, companion mode) — user rejected these as too complex
- Don't use `<button>` inside `<button>` — causes hydration errors
- Don't claim features work without running Playwright E2E tests
- Don't use framer-motion `initial={{ opacity: 0 }}` on content wrappers — if hydration fails, content stays invisible
