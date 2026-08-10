# AFDE Landing Page + Redesign — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this spec task-by-task.

**Goal:** Transform AFDE from a functional-but-plain financial app into a production-grade product with a professional landing page, cohesive design system, and delightful user experience.

**Architecture:** Single-page React app with client-side routing (react-router-dom). Landing page at `/`, app at `/app`, blog at `/blog/:slug`. All share the same dark theme with elegant, sober fintech aesthetics.

**Tech Stack:** React 18, Vite 5, Recharts, react-router-dom, Lucide React (icons), CSS Modules or inline styles (existing pattern).

---

## Design System

### Color Palette — "Dark Wealth"

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#0c0f15` | Main background (deep charcoal, not pure black) |
| `surface` | `#151a24` | Cards, sections |
| `surfaceLight` | `#1e2635` | Hover, borders |
| `primary` | `#8b9dc3` | Muted blue-gray — CTAs, links |
| `primaryDark` | `#6a7da0` | Button hover |
| `accent` | `#a8b5cc` | Silver-gray — subtle highlights |
| `danger` | `#c98474` | Muted terracotta — alerts, losses |
| `success` | `#7d9f8a` | Sage green — positive metrics |
| `warning` | `#c9a84c` | Muted gold — warnings |
| `text` | `#e8eaf0` | Off-white text |
| `textMuted` | `#8892a8` | Secondary text, labels |
| `border` | `#2a3346` | Subtle borders |

### Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display | `DM Serif Display` | 400 | Hero headings, section titles (elegant, sober) |
| Heading | `Inter` | 600, 700 | Card titles, subtitles |
| Body | `Inter` | 400, 500 | Paragraphs, descriptions |
| Mono | `JetBrains Mono` | 400, 600 | Numbers, KPIs, financial data |

Scale: 11 / 13 / 14 / 15 / 18 / 24 / 32 / 48 / 64px

### Spacing
4px base unit. Section padding: 80px (desktop), 48px (mobile).

### Effects
- Box shadows: `0 1px 3px rgba(0,0,0,0.3)` for subtle depth
- Glassmorphism on hover: `backdrop-blur(8px)` with semi-transparent bg
- Border radius: 8px (cards), 4px (inputs), 2px (badges)
- Transitions: 200-250ms ease-out

---

## Landing Page Structure

### Navigation
- Sticky top nav, semi-transparent with backdrop-blur
- Logo (text or SVG) on left
- Links: Problems, Benefits, How It Works, Blog
- Right side: "Launch App" button (primary) + GitHub icon
- Mobile: hamburger menu with slide-in drawer

### Hero Section
- Full-width gradient from `#0c0f15` to `#151a24`
- Headline in DM Serif Display: "Turn raw business data into validated financial decisions"
- Subtitle in Inter 18px: "Not a dashboard. A decision engine that analyzes, recommends, and executes — with your approval."
- Two CTAs: "Launch App" (primary) · "See How It Works" (outline)
- Background: subtle animated grid or floating numbers pattern (CSS only, lightweight)
- Stat badges below: "95% faster reporting · Save $80K+/year · 10 financial engines"

### Problems Section
- Eyebrow label: "The problems we solve"
- Heading: "Dashboards show data. AFDE shows decisions."
- 4 problem cards in 2×2 grid:
  1. **The Dashboard Trap** — Charts don't make decisions. AFDE recommends actions.
  2. **Profit ≠ Cash** — Healthy P&L while running out of cash. AFDE shows real runway.
  3. **AI That Hallucinates** — AI never calculates. It interprets validated KPIs only.
  4. **No CFO? No Problem** — Automate $80K-$200K/year of financial analysis.
- Each card: icon (Lucide), title, description, subtle hover effect
- "What happens without AFDE" — flip side: reactive decisions, missed warnings, burned cash

### Features Section
- Grid of 10 capability cards (animated entrance on scroll)
- Each: icon + name + 1-line description
- Categories: KPI Engine, Cash Flow, Anomalies, Forecast, Variance, Benchmarks, Covenants, Agent, Copilot, Notifications

### How It Works
- Visual pipeline: Data → Financial Engine → AI Layer → Agent Manager → Decision
- Each step expandable with details
- Clean horizontal flow with connecting lines on desktop, vertical on mobile

### Metrics / Trust Bar
- Key stats: "95% faster monthly reporting" · "5 minutes vs 4-6 hours" · "10 integrated analysis engines" · "Human-in-the-loop approval"

### Blog Preview
- "Latest from the AFDE Blog"
- 3 most recent article cards with title, excerpt, date, read time
- "View all articles" link

### Final CTA
- "Start making data-driven financial decisions"
- Subtitle: "Upload your data, get insights instantly. No credit card. No setup."
- Large "Launch App" button
- Background: subtle gradient or particle effect

### Footer
- Logo + tagline
- Navigation links
- "Built for CFOs, Founders, and Finance Teams"
- Copyright
- Social links (GitHub, Twitter/X)

---

## App Redesign (/app)

### Changes from current state
- Replace ALL emoji tab icons with Lucide SVG icons
- Apply new color tokens consistently
- Improve card spacing and typography
- Add subtle micro-interactions (hover states, transitions)
- Keep all existing functionality intact
- Replace inline CSS with theme tokens from `theme.js`

### New tab icons (Lucide)
- Data Input → `Upload`
- KPI Overview → `BarChart3`
- Unit Economics → `DollarSign`
- Break-Even → `Target`
- Scenarios → `LineChart`
- AI Insights → `Lightbulb`
- AI Copilot → `MessageSquare`
- Agent Manager → `Bot`
- Decision Summary → `FileText`

---

## Blog (/blog)

- Route: `/blog` (list) · `/blog/:slug` (article)
- Articles stored as markdown in `src/content/blog/`
- Basic structure: title, date, author, excerpt, content, tags
- Example articles:
  - "Why Profit Doesn't Equal Cash Flow"
  - "The Dashboard Trap: Why More Data Doesn't Mean Better Decisions"
  - "How to Calculate Your Break-Even Point in 5 Minutes"
  - "AI in Finance: Why Interpretation Beats Calculation"
  - "3 Red Flags Your Business Is Running Out of Cash"

---

## SEO & GEO

- Meta tags, OG tags, Twitter Cards in all pages
- Blog articles with structured data (Article schema)
- `robots.txt` and `sitemap.xml` (auto-generated)
- `llms.txt` for AI crawler optimization
- Semantic HTML headings

---

## Future (P3 — not in this spec)

- File upload (CSV/JSON) with Papa Parse
- AI API configuration UI (OpenAI, Anthropic, OpenRouter keys in localStorage)
- These will be designed in a separate spec
