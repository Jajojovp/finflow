# FinFlow — Financial Intelligence Engine

> **Decision clarity in real-time.** AI-powered financial decision engine for modern businesses.

FinFlow unifies KPI calculation, cash-flow analysis, forecasting, anomaly detection and an autonomous agent — so your team moves from numbers to action in minutes.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **KPI Engine** | Compute margins, runway, current ratio and 20+ indicators with validated formulas |
| **Cash Flow Analysis** | 13-week projections, sensitivity scenarios and liquidity stress tests |
| **Forecasting** | Trend-and-seasonality projections with confidence intervals |
| **Anomaly Detection** | Statistical outlier detection (3-sigma, MoM change) across revenue, expenses and cash |
| **Benchmarking** | Compare company metrics against industry benchmarks with gap analysis |
| **Covenant Monitoring** | Track financial covenants against limits (cash, DSCR, current ratio, growth) |
| **Autonomous Agent** | Proposes corrective actions with rationale, confidence and human-in-the-loop approval |
| **Smart Notifications** | Event-bus driven notifications for breaches, anomalies and agent actions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FinFlow                              │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND (React 18 + Vite 5 + Tailwind)                   │
│  ├─ Landing (marketing)                                     │
│  ├─ Dashboard (KPIs · charts · cash position)               │
│  ├─ Analysis  (anomalies · benchmarks · variances)          │
│  ├─ Forecast  (projections · covenants)                     │
│  └─ Settings  (profile · notifications · agent)             │
├─────────────────────────────────────────────────────────────┤
│  SERVICE LAYER                                              │
│  ├─ core/                                                   │
│  │   ├─ MathUtils         (pure numeric helpers)            │
│  │   ├─ DataValidator     (runtime validation)              │
│  │   └─ EventBus          (pub/sub decoupling)              │
│  ├─ financial/                                              │
│  │   ├─ KPICalculator     (KPI snapshot from series)        │
│  │   ├─ CashFlowService   (flows · stress tests)            │
│  │   ├─ ForecastingService(seasonal + trend projection)     │
│  │   ├─ AnomalyService    (statistical outlier detection)   │
│  │   ├─ BenchmarkService  (industry comparison)             │
│  │   ├─ CovenantService   (limit evaluation)                │
│  │   └─ VarianceService   (budget vs actual)                │
│  ├─ agent/                                                  │
│  │   ├─ AgentOrchestrator (pure action proposal logic)      │
│  │   └─ useAgentManager   (React hook · approval flow)      │
│  └─ notifications/                                          │
│      └─ NotificationService (EventBus-driven dispatcher)    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
MONTHLY_FINANCIALS (series)
    │
    ├── KPICalculator.fromMonthly()        → kpis
    ├── CashFlowService.monthlyNetFlow()   → cash series
    ├── AnomalyService.detect()            → anomalies
    ├── BenchmarkService.compare()         → benchmark gaps
    ├── VarianceService.monthly()          → variances
    ├── ForecastingService.forecast()      → projections
    ├── CovenantService.evaluate()         → covenant status
    │
    └── AgentOrchestrator.propose()        → actions (human-approved)
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
# → http://localhost:3001

# 3. Production build
npm run build

# 4. Preview production build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── main.jsx                     # React entry
├── App.jsx                      # Lazy-loaded routes
├── components/
│   ├── ui/                      # Button · Card · Badge · Input · Modal · Tabs · Table · Skeleton · EmptyState
│   ├── layout/                  # Navbar · Sidebar · PageContainer
│   ├── charts/                  # BarChart · LineChart · MetricCard
│   └── landing/                 # Hero · Features · HowItWorks · Metrics · CTA · Footer
├── pages/                       # Landing · Dashboard · Analysis · Forecast · Settings
├── services/
│   ├── core/                    # MathUtils · DataValidator · EventBus
│   ├── financial/               # 7 financial services
│   ├── agent/                   # AgentOrchestrator · useAgentManager
│   └── notifications/           # NotificationService
├── hooks/                       # useMediaQuery
├── data/                        # datasets.js (sample financials)
├── styles/                      # global.css (Tailwind + tokens)
└── utils/                       # formatters.js
```

---

## 🎨 Design System

- **Dark-first fintech theme** — deep navy `#0B0F19` background
- **Electric blue primary** `#3B82F6` for trust and action
- **Typography** — Plus Jakarta Sans (display) · Inter (body) · JetBrains Mono (data)
- **Accessible** — WCAG 2.2 AA contrast, focus-visible rings, reduced-motion support
- **Responsive** — mobile-first breakpoints (375 / 768 / 1024 / 1440)

---

## 🔌 Deploy

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

`vercel.json` already includes SPA rewrites for client-side routing.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · React Router 6 |
| Build | Vite 5 · Tailwind CSS 3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Utilities | clsx · date-fns |

---

## 📄 License

MIT — Use freely for commercial, educational, and portfolio purposes.
