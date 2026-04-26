# LegitCheck PH

> **Check muna bago bayad.**
> The Philippines' anti-scam risk checker for buyers, sellers, OFWs, and businesses.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase Postgres (with RLS) |
| AI Agents | Anthropic Claude (claude-sonnet-4) |
| Hosting | Vercel (recommended) |
| Image OCR | Claude Vision API (built-in) |

---

## Project Structure

```
legitcheck-ph/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── auth/
│   │   ├── login/page.tsx        # Login
│   │   ├── signup/page.tsx       # Signup
│   │   ├── callback/route.ts     # OAuth callback
│   │   └── signout/route.ts      # Sign out
│   ├── buyer/page.tsx            # Check input screen
│   ├── seller/page.tsx           # Seller help
│   ├── result/
│   │   ├── [id]/page.tsx         # Saved result
│   │   └── preview/page.tsx      # Unsaved result
│   ├── dashboard/
│   │   ├── page.tsx              # User dashboard
│   │   ├── agents/page.tsx       # AI agents chat
│   │   └── pricing/page.tsx      # Pricing plans
│   ├── privacy/page.tsx          # Privacy policy
│   └── api/
│       ├── analyze/route.ts      # AI analysis endpoint
│       └── agents/chat/route.ts  # Agent chat endpoint
├── components/
│   └── ResultClient.tsx          # Result display
├── lib/
│   ├── decisionEngine.ts         # Risk scoring engine
│   ├── agents.ts                 # Agent definitions + prompts
│   ├── pricing.ts                # Pricing plans
│   └── supabase/
│       ├── client.ts             # Browser client
│       ├── server.ts             # Server client
│       └── middleware.ts         # Auth middleware
├── types/index.ts                # TypeScript types
├── middleware.ts                 # Route protection
└── supabase/migrations/          # DB schema
```

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/yourorg/legitcheck-ph.git
cd legitcheck-ph
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/migrations/001_initial_schema.sql`
3. In Authentication → Providers, enable **Google** (get credentials from Google Cloud Console)
4. In Authentication → URL Configuration, add:
   - Site URL: `http://localhost:3000` (dev) or your production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Set up Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-click deploy

```bash
npx vercel --prod
```

### Manual steps

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Add all environment variables from `.env.local`
4. Set **Framework Preset** to Next.js
5. Deploy

### Post-deploy Supabase config

Update in Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## AI Agents

Five expert agents are available in `/dashboard/agents`:

| Agent | Name | Expertise |
|-------|------|-----------|
| 🕵️ Fraud Detector | FraudGuard | Philippine scam patterns, risk analysis |
| 🧪 QA Engineer | QA Rex | Testing, edge cases, security |
| 📋 CPO | CPO Maya | Product strategy, roadmap |
| 📣 CMO | CMO Rico | Marketing, growth, Filipino digital |
| 🎨 Product Designer | UX Pia | Mobile UX, Filipino design patterns |

All agents are powered by Claude and have full context of LegitCheck PH's product, users, and mission.

---

## Risk Engine

Local TypeScript decision engine in `lib/decisionEngine.ts`:

- **Base score**: 25
- **Signals**: 30+ signals across 7 categories, each with risk points (+/-)
- **Hard red**: Certain signal combinations force Red regardless of score
- **Score range**: 0–100, clamped
- **Verdicts**:
  - 🟢 Green: 0–39 — OK, stay careful
  - 🟡 Yellow: 40–69 — Verify first
  - 🔴 Red: 70–100 — Don't proceed yet

Categories: Online Purchase, Investment/OFW, Donation, Vendor/Business, Property/Land, Job/Agency, Buyer Check

---

## Database Schema

Tables:
- `profiles` — user accounts (linked to Supabase Auth)
- `checks` — check records with full result JSON
- `agent_sessions` — AI agent conversation history

All tables have Row Level Security (RLS) enabled — users can only access their own data.

---

## Roadmap (TODOs in code)

- [ ] Real OCR extraction (Tesseract.js or AWS Textract)
- [ ] Mobile share extension (Web Share API)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Supabase Storage for evidence vault
- [ ] Human review queue for high-risk cases
- [ ] Seller verification workflow + trust badge
- [ ] Business / vendor due diligence
- [ ] Property / land due diligence workflow
- [ ] Trust Graph (link analysis across cases)
- [ ] SEC, DTI, NBI API integrations (when available)
- [ ] Shopee / Lazada / GCash verified lookup

---

## License

MIT — built for the Filipino community.

---

## Disclaimer

LegitCheck PH is a risk analysis guide. It is not a final legal, banking, platform, government, or law-enforcement decision. Always verify further before proceeding with any transaction.
