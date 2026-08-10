# AFDE Landing Page + Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade landing page and redesign the AFDE app with a sober, elegant fintech design system.

**Architecture:** Single-page React app with react-router-dom. Landing at `/`, app at `/app`, blog at `/blog`. All pages share the same Dark Wealth theme.

**Tech Stack:** React 18, Vite 5, Recharts, react-router-dom, Lucide React, DM Serif Display + Inter + JetBrains Mono (fonts via Google Fonts or bundled).

---

## Global Constraints

- No bright/neon colors — only the approved Dark Wealth palette
- Replace ALL emoji icons with Lucide SVG icons
- No new CSS framework — keep inline styles with theme.js tokens
- All existing app functionality must remain intact
- Landing page must work fully on mobile (responsive)
- Animations must be CSS-only (no framer-motion dependency)
- Blog articles stored as JS objects (no markdown parser needed)

---

## File Structure

### New files
```
src/
  pages/
    Landing.jsx          — Landing page (all sections composed)
    AppPage.jsx          — Existing app logic (extracted from App.jsx)
    BlogList.jsx         — Blog listing
    BlogPost.jsx         — Individual blog post
  components/
    landing/
      Nav.jsx            — Sticky navigation
      Hero.jsx           — Hero section
      Problems.jsx       — Problems/solution cards
      Features.jsx       — Feature capability grid
      HowItWorks.jsx     — Pipeline visualization
      Metrics.jsx        — Stats/trust bar
      BlogPreview.jsx    — Latest articles preview
      CTA.jsx            — Final call-to-action
      Footer.jsx         — Site footer
    shared/
      SectionTitle.jsx   — Reusable section heading component
      Card.jsx           — Reusable card wrapper
  content/
    blog/
      articles.js        — Blog article data (JS array of objects)

public/
  llms.txt               — AI crawler optimization

docs/
  superpowers/
    specs/               — Design spec (already exists)
    plans/               — This plan
```

### Modified files
```
src/App.jsx              — Becomes router (imports from pages/)
src/main.jsx             — BrowserRouter wrapper
src/styles/theme.js      — New Dark Wealth palette
src/components/AgentDashboard.jsx — Replace emoji with Lucide
package.json             — Add react-router-dom, lucide-react
```

### Deleted (no longer needed in App.jsx as inline)
- Most of App.jsx content moves to AppPage.jsx

---

## Task Breakdown

### Task 1: Dependencies + Theme System

**Files:**
- Modify: `package.json`
- Modify: `src/styles/theme.js`
- Create: `public/llms.txt`

- [ ] **Step 1.1: Install dependencies**

```bash
npm install react-router-dom lucide-react
```

- [ ] **Step 1.2: Update theme.js with Dark Wealth palette**

Replace `src/styles/theme.js` content with:

```js
export const THEME = {
  colors: {
    bg:           '#0c0f15',
    surface:      '#151a24',
    surfaceLight: '#1e2635',
    primary:      '#8b9dc3',
    primaryDark:  '#6a7da0',
    accent:       '#a8b5cc',
    danger:       '#c98474',
    success:      '#7d9f8a',
    warning:      '#c9a84c',
    text:         '#e8eaf0',
    textMuted:    '#8892a8',
    border:       '#2a3346',
  },
  fonts: {
    display: "'DM Serif Display', serif",
    heading: "'Inter', sans-serif",
    body:    "'Inter', sans-serif",
    mono:    "'JetBrains Mono', monospace",
  },
  radii: {
    card:    8,
    input:   4,
    badge:   2,
  },
  shadows: {
    card: '0 1px 3px rgba(0,0,0,0.3)',
    glow: '0 0 20px rgba(139,157,195,0.1)',
  },
};
```

- [ ] **Step 1.3: Create llms.txt**

```txt
# AFDE — AI Financial Decision Engine
> Turn raw business data into validated financial decisions.

AFDE is a financial intelligence application for CFOs, finance teams, and founders. It combines a financial calculation engine with structured AI interpretation, anomaly detection, and an autonomous agent that recommends corrective actions with human approval.

## Key capabilities
- KPI calculation (revenue, margins, break-even, unit economics)
- Cash flow analysis (runway, working capital, inventory turns)
- Anomaly detection (Z-score outliers, business rules, pattern shifts)
- Revenue forecasting (linear, exponential smoothing, moving average)
- Budget variance analysis with CFO-style commentary
- Industry benchmarking (percentile rankings, A-F grading)
- Covenant monitoring (DSCR, leverage, current ratio)
- Autonomous agent with human-in-the-loop approval
- AI financial copilot (question answering from validated data)
- Configurable notification rules with webhook delivery

## Use cases
- Monthly financial reporting (95% faster)
- Channel profitability analysis
- Break-even sensitivity modeling
- Cash runway monitoring
- Budget vs actual variance tracking
- Debt covenant compliance

## Links
- App: https://afde.vercel.app/app
```

- [ ] **Step 1.4: Verify**

```bash
npm run build
```

---

### Task 2: Router + Page Structure

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `src/pages/AppPage.jsx`

- [ ] **Step 2.1: Update main.jsx with BrowserRouter**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 2.2: Create routing App.jsx**

```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AppPage from './pages/AppPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
    </Routes>
  );
}
```

- [ ] **Step 2.3: Extract existing app to AppPage.jsx**

Copy the full App.jsx content (all 599 lines including state, effects, tabs, etc.) into `src/pages/AppPage.jsx`. Wrap it in a div with the theme background. The import for `THEME` should use the existing relative path.

- [ ] **Step 2.4: Verify**

```bash
npm run build
```

---

### Task 3: Shared Components + Landing Shell

**Files:**
- Create: `src/pages/Landing.jsx`
- Create: `src/components/shared/SectionTitle.jsx`
- Create: `src/components/shared/Card.jsx`

- [ ] **Step 3.1: Create SectionTitle component**

```jsx
import React from 'react';
import { THEME as T } from '../../styles/theme';

export default function SectionTitle({ eyebrow, title, align = 'center' }) {
  return (
    <div style={{ textAlign: align, marginBottom: 56, maxWidth: 720, margin: align === 'center' ? '0 auto 56px' : '0 0 56px' }}>
      {eyebrow && (
        <div style={{
          fontFamily: T.fonts.body, fontSize: 12, fontWeight: 600,
          color: T.colors.primary, textTransform: 'uppercase',
          letterSpacing: '2px', marginBottom: 12,
        }}>
          {eyebrow}
        </div>
      )}
      <h2 style={{
        fontFamily: T.fonts.display, fontSize: 36, fontWeight: 400,
        color: T.colors.text, lineHeight: 1.2, margin: 0,
      }}>
        {title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 3.2: Create Landing shell**

```jsx
import React from 'react';
import { THEME as T } from '../styles/theme';
import Nav from '../components/landing/Nav';
import Hero from '../components/landing/Hero';
import Problems from '../components/landing/Problems';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Metrics from '../components/landing/Metrics';
import BlogPreview from '../components/landing/BlogPreview';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div style={{ background: T.colors.bg, minHeight: '100vh', color: T.colors.text }}>
      <Nav />
      <Hero />
      <Problems />
      <Features />
      <HowItWorks />
      <Metrics />
      <BlogPreview />
      <CTA />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3.3: Verify**

```bash
npm run build
```

---

### Task 4: Navigation + Hero

**Files:**
- Create: `src/components/landing/Nav.jsx`
- Create: `src/components/landing/Hero.jsx`

- [ ] **Step 4.1: Navigation component**

Sticky top nav with backdrop-blur. Logo "AFDE" in DM Serif Display. Links: Problems, How It Works, Blog. Right side: "Launch App" primary button + GitHub icon.

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { THEME as T } from '../../styles/theme';
import { ExternalLink, Menu, X, Github } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Problems', href: '#problems' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Blog', href: '/blog' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    padding: '16px 24px',
    background: scrolled ? 'rgba(12,15,21,0.85)' : 'transparent',
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    borderBottom: scrolled ? `1px solid ${T.colors.border}` : '1px solid transparent',
    transition: 'all 0.3s ease',
  };

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontFamily: T.fonts.display, fontSize: 22, color: T.colors.text, textDecoration: 'none' }}>
          AFDE
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {NAV_LINKS.map(l => (
            <Link key={l.label} to={l.href}
              style={{ fontFamily: T.fonts.body, fontSize: 13, fontWeight: 500, color: T.colors.textMuted, textDecoration: 'none', letterSpacing: '0.3px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = T.colors.text}
              onMouseLeave={e => e.target.style.color = T.colors.textMuted}>
              {l.label}
            </Link>
          ))}
          <Link to="/app" style={{
            padding: '10px 24px', background: T.colors.primary, color: T.colors.bg,
            borderRadius: T.radii.card, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.target.style.background = T.colors.primaryDark}
            onMouseLeave={e => e.target.style.background = T.colors.primary}>
            <ExternalLink size={14} /> Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4.2: Hero component**

Full-width hero with gradient background, headline in DM Serif Display, subtitle, CTAs, and stat badges below.

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { THEME as T } from '../../styles/theme';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

const STATS = [
  { icon: Zap, label: '95% faster', sub: 'monthly reporting' },
  { icon: Shield, label: 'Save $80K+', sub: 'per year on analysis' },
  { icon: TrendingUp, label: '10 engines', sub: 'integrated analysis' },
];

export default function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', textAlign: 'center',
      padding: '120px 24px 80px',
      background: `linear-gradient(135deg, ${T.colors.bg} 0%, #111827 50%, ${T.colors.bg} 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid pattern overlay (CSS only) */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(${T.colors.primary} 1px, transparent 1px), linear-gradient(90deg, ${T.colors.primary} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
        <p style={{
          fontFamily: T.fonts.body, fontSize: 12, fontWeight: 600,
          color: T.colors.primary, textTransform: 'uppercase',
          letterSpacing: '2px', marginBottom: 20,
        }}>
          AI FINANCIAL DECISION ENGINE
        </p>
        <h1 style={{
          fontFamily: T.fonts.display, fontSize: 52, fontWeight: 400,
          color: T.colors.text, lineHeight: 1.15, margin: '0 0 20px',
        }}>
          Turn raw business data into{' '}
          <span style={{ color: T.colors.primary }}>validated financial decisions</span>
        </h1>
        <p style={{
          fontFamily: T.fonts.body, fontSize: 18, color: T.colors.textMuted,
          lineHeight: 1.7, maxWidth: 600, margin: '0 auto 36px',
        }}>
          Not a dashboard. A decision engine that analyzes, recommends, and executes — with your approval. 10 integrated engines, one interface, zero hallucinations.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/app" style={{
            padding: '14px 36px', background: T.colors.primary, color: T.colors.bg,
            borderRadius: T.radii.card, fontSize: 14, fontWeight: 600,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.target.style.background = T.colors.primaryDark; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.background = T.colors.primary; e.target.style.transform = 'none'; }}>
            Launch App <ArrowRight size={16} />
          </Link>
          <a href="#problems" style={{
            padding: '14px 36px', background: 'transparent', color: T.colors.text,
            borderRadius: T.radii.card, fontSize: 14, fontWeight: 500,
            textDecoration: 'none', border: `1px solid ${T.colors.border}`,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.target.style.borderColor = T.colors.textMuted}
            onMouseLeave={e => e.target.style.borderColor = T.colors.border}>
            See How It Works
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 48, marginTop: 64, flexWrap: 'wrap',
        justifyContent: 'center', position: 'relative', zIndex: 1,
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <s.icon size={20} color={T.colors.primary} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: T.fonts.heading, fontSize: 24, fontWeight: 700, color: T.colors.text }}>{s.label}</div>
            <div style={{ fontFamily: T.fonts.body, fontSize: 12, color: T.colors.textMuted, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4.3: Verify**

```bash
npm run build
```

---

### Task 5: Problems + Features Sections

**Files:**
- Create: `src/components/landing/Problems.jsx`
- Create: `src/components/landing/Features.jsx`

- [ ] **Step 5.1: Problems component**

4 problem cards in 2×2 grid with icon + title + description + consequence.

- [ ] **Step 5.2: Features component**

10 capability cards in responsive grid with icon + name + 1-line description.

- [ ] **Step 5.3: Verify**

```bash
npm run build
```

---

### Task 6: HowItWorks + Metrics + CTA

**Files:**
- Create: `src/components/landing/HowItWorks.jsx`
- Create: `src/components/landing/Metrics.jsx`
- Create: `src/components/landing/CTA.jsx`

- [ ] **Step 6.1: HowItWorks pipeline**
- [ ] **Step 6.2: Metrics / trust bar**
- [ ] **Step 6.3: Final CTA section**
- [ ] **Step 6.4: Verify build**

---

### Task 7: Footer + BlogPreview

**Files:**
- Create: `src/components/landing/Footer.jsx`
- Create: `src/components/landing/BlogPreview.jsx`
- Create: `src/content/blog/articles.js`

- [ ] **Step 7.1: Footer with links and copyright**
- [ ] **Step 7.2: Blog article data (5 articles as JS objects)**
- [ ] **Step 7.3: BlogPreview component**
- [ ] **Step 7.4: Verify build**

---

### Task 8: Blog Pages

**Files:**
- Create: `src/pages/BlogList.jsx`
- Create: `src/pages/BlogPost.jsx`

- [ ] **Step 8.1: BlogList page**
- [ ] **Step 8.2: BlogPost page**
- [ ] **Step 8.3: Add blog routes to App.jsx**
- [ ] **Step 8.4: Verify build**

---

### Task 9: App Redesign (Icons + Theme)

**Files:**
- Modify: `src/pages/AppPage.jsx`
- Modify: `src/components/AgentDashboard.jsx`

- [ ] **Step 9.1: Replace emoji icons with Lucide in AppPage tabs**

Tab icons mapping:
- `📥` → `<Upload size={16} />`
- `📊` → `<BarChart3 size={16} />`
- `💰` → `<DollarSign size={16} />`
- `📉` → `<Target size={16} />`
- `📈` → `<LineChart size={16} />`
- `🧠` → `<Lightbulb size={16} />`
- `🤖` → `<MessageSquare size={16} />`
- `⚙️` → `<Bot size={16} />`
- `📄` → `<FileText size={16} />`

- [ ] **Step 9.2: Replace emoji icons with Lucide in AgentDashboard**

Replace all emoji icons used in the dashboard sections (alert bell, action icons, status indicators).

- [ ] **Step 9.3: Apply new color tokens**

Update any hardcoded colors in both files to use `T.colors.*` tokens.

- [ ] **Step 9.4: Verify build**

---

### Task 10: SEO + Animations + Polish

**Files:**
- Modify: `index.html`
- Modify: `src/pages/Landing.jsx` (scroll animations)
- Create: `src/hooks/useScrollReveal.js`
- Create: `src/styles/global.css` (Google Fonts import, scrollbar styles)

- [ ] **Step 10.1: Add Google Fonts link to index.html**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

- [ ] **Step 10.2: Create useScrollReveal hook**

Simple IntersectionObserver-based hook that adds a fade-in-up class when elements enter viewport.

- [ ] **Step 10.3: Add global CSS with @import for fonts, smooth scroll, scrollbar styles**
- [ ] **Step 10.4: Verify final build**

```bash
npm run build
npm run preview  # Serve and test manually
```
